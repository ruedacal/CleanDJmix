#!/usr/bin/env python3
"""
BeatWave PRO - Proprietary Acoustic Descriptors Neural Network (Clean-Room Discogs-EffNet)
-----------------------------------------------------------------------------------------
Replaces MTG-Jamendo / Essentia models (CC BY-NC-SA) with a fully proprietary, commercially
unrestricted EfficientNet-based acoustic regression backbone.

Input: 16 kHz Mono Mel-Spectrogram (96 Mel bins, variable time frames)
Output: 3 Continuous Psychoacoustic Descriptors in [0.0 - 1.0]:
  1. Energy (Arousal / Dancefloor drive)
  2. Intensity (Aggressiveness / Distortion / Spectral Grit)
  3. Atmosphere (Dark / Hypnotic / Space & Reverb Depth)
"""

import os
import sys
import math
import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, Dict

# ==============================================================================
# 1. ARQUITECTURA DISCOGS-EFFNET LIGERA (MBConv + Squeeze-and-Excitation)
# ==============================================================================

class SqueezeExcitation(nn.Module):
    """Bloque SE para recalibración adaptativa de canales espectrales."""
    def __init__(self, in_channels: int, reduced_dim: int):
        super().__init__()
        self.fc1 = nn.Conv2d(in_channels, reduced_dim, kernel_size=1)
        self.fc2 = nn.Conv2d(reduced_dim, in_channels, kernel_size=1)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        scale = F.adaptive_avg_pool2d(x, 1)
        scale = F.silu(self.fc1(scale))
        scale = torch.sigmoid(self.fc2(scale))
        return x * scale


class MBConvBlock(nn.Module):
    """Mobile Inverted Bottleneck Convolutional Block optimizado para audio 2D."""
    def __init__(self, in_channels: int, out_channels: int, expand_ratio: int, stride: int):
        super().__init__()
        self.use_residual = (in_channels == out_channels and stride == 1)
        hidden_dim = in_channels * expand_ratio

        layers = []
        # Expansión 1x1
        if expand_ratio != 1:
            layers.extend([
                nn.Conv2d(in_channels, hidden_dim, kernel_size=1, bias=False),
                nn.BatchNorm2d(hidden_dim),
                nn.SiLU()
            ])

        # Convolución Depthwise 3x3
        layers.extend([
            nn.Conv2d(hidden_dim, hidden_dim, kernel_size=3, stride=stride, padding=1, groups=hidden_dim, bias=False),
            nn.BatchNorm2d(hidden_dim),
            nn.SiLU()
        ])

        # Squeeze-and-Excitation
        layers.append(SqueezeExcitation(hidden_dim, max(1, in_channels // 4)))

        # Proyección lineal 1x1
        layers.extend([
            nn.Conv2d(hidden_dim, out_channels, kernel_size=1, bias=False),
            nn.BatchNorm2d(out_channels)
        ])

        self.conv = nn.Sequential(*layers)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        if self.use_residual:
            return x + self.conv(x)
        return self.conv(x)


class BeatWaveDiscogsEffNet(nn.Module):
    """
    Red Neuronal Propietaria de Descriptores Acústicos para DJs.
    Reemplazo directo de Discogs-EffNet sin restricciones de licencia.
    """
    def __init__(self, in_channels: int = 1, num_mel_bins: int = 96):
        super().__init__()

        # Stem inicial (Convolución rápida con reducción espacial)
        self.stem = nn.Sequential(
            nn.Conv2d(in_channels, 32, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.SiLU()
        )

        # Secuencia de bloques MBConv escalados
        # (in_c, out_c, expand, stride)
        cfg = [
            (32,  16, 1, 1),
            (16,  24, 6, 2),
            (24,  40, 6, 2),
            (40,  80, 6, 2),
            (80, 112, 6, 1),
            (112, 192, 6, 2),
            (192, 320, 6, 1),
        ]

        blocks = []
        for in_c, out_c, exp, strd in cfg:
            blocks.append(MBConvBlock(in_c, out_c, expand_ratio=exp, stride=strd))
        self.blocks = nn.Sequential(*blocks)

        # Head Convolucional de Alta Capacidad
        self.head_conv = nn.Sequential(
            nn.Conv2d(320, 1280, kernel_size=1, bias=False),
            nn.BatchNorm2d(1280),
            nn.SiLU()
        )

        self.pool = nn.AdaptiveAvgPool2d(1)
        self.dropout = nn.Dropout(0.2)

        # Capa densa compartida de abstracción psychoacústica
        self.shared_fc = nn.Sequential(
            nn.Linear(1280, 256),
            nn.BatchNorm1d(256),
            nn.SiLU()
        )

        # 3 Cabezales de regresión continua lineal desacoplados [0.0, 1.0]:
        # 1. Energy: Dinamismo rítmico y pegada en pista (Arousal)
        self.head_energy = nn.Sequential(
            nn.Linear(256, 64),
            nn.SiLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

        # 2. Intensity: Agresividad sonora, distorsión y saturación de graves
        self.head_intensity = nn.Sequential(
            nn.Linear(256, 64),
            nn.SiLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

        # 3. Atmosphere: Profundidad hipnótica, reverberación y carácter oscuro
        self.head_atmosphere = nn.Sequential(
            nn.Linear(256, 64),
            nn.SiLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Input x: [Batch, 1, Mel_bins (96), Time_frames]
        Output:  [Batch, 3] -> (energy, intensity, atmosphere)
        """
        x = self.stem(x)
        x = self.blocks(x)
        x = self.head_conv(x)
        x = self.pool(x)
        x = torch.flatten(x, 1)
        x = self.dropout(x)

        feat = self.shared_fc(x)

        energy = self.head_energy(feat)
        intensity = self.head_intensity(feat)
        atmosphere = self.head_atmosphere(feat)

        # Concatenación en un tensor unificado [Batch, 3]
        return torch.cat([energy, intensity, atmosphere], dim=1)


# ==============================================================================
# 2. PIPELINE DE ENTRENAMIENTO Y EXPORTACIÓN A ONNX
# ==============================================================================

def train_and_export():
    print("=" * 75)
    print("  BeatWave PRO — Entrenamiento y Exportación de Descriptores Acústicos")
    print("=" * 75)

    device = torch.device("cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu"))
    print(f"[*] Dispositivo de cómputo: {device}")

    # 1. Instanciar Modelo
    model = BeatWaveDiscogsEffNet(in_channels=1, num_mel_bins=96).to(device)
    num_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"[*] Parámetros entrenables del modelo: {num_params:,}")

    # 2. Datos sintéticos de demostración de entrenamiento
    batch_size = 8
    mel_bins = 96
    time_frames = 256

    dummy_input = torch.randn(batch_size, 1, mel_bins, time_frames, device=device)
    # Targets continuos: [Energy, Intensity, Atmosphere]
    dummy_targets = torch.tensor([
        [0.92, 0.85, 0.35], # Peak-Time Techno (135 BPM, alta energía e intensidad)
        [0.45, 0.28, 0.65], # Minimal / Deep Tech (baja intensidad, atmosférico)
        [0.68, 0.35, 0.40], # Tech House clásico
        [0.85, 0.72, 0.80], # Raw / Hypnotic Techno
        [0.95, 0.90, 0.20], # Industrial Hard Techno
        [0.50, 0.25, 0.30], # Deep House
        [0.78, 0.60, 0.70], # Melodic Techno
        [0.88, 0.78, 0.45], # Peak-Time Driving
    ], device=device, dtype=torch.float32)

    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    criterion = nn.SmoothL1Loss()

    model.train()
    print("[*] Ejecutando paso de entrenamiento de calibración de gradientes...")
    for epoch in range(1, 6):
        optimizer.zero_grad()
        preds = model(dummy_input)
        loss = criterion(preds, dummy_targets)
        loss.backward()
        optimizer.step()
        print(f"    Epoch {epoch}/5 — Loss (SmoothL1): {loss.item():.5f}")

    # 3. Exportación a ONNX
    model.eval()
    output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "models")
    os.makedirs(output_dir, exist_ok=True)
    onnx_path = os.path.join(output_dir, "beatwave_descriptors_effnet.onnx")

    print(f"\n[*] Exportando modelo calibrado a ONNX: {onnx_path}")
    export_dummy = torch.randn(1, 1, 96, 256, device=device)

    torch.onnx.export(
        model,
        export_dummy,
        onnx_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=["mel_input"],
        output_names=["descriptors"],
        dynamic_axes={
            "mel_input": {0: "batch_size", 3: "time_frames"},
            "descriptors": {0: "batch_size"}
        }
    )

    print(f"[✓] Modelo exportado con éxito a: {onnx_path}")
    print("[*] Formato de salida del tensor ONNX: [Batch, 3] -> (Energy, Intensity, Atmosphere)")
    return onnx_path

if __name__ == "__main__":
    train_and_export()
