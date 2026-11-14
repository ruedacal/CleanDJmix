#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de reparación masiva de BeatGrids y Downbeats acústicos para Serato DJ Pro.
Re-analiza en paralelo por subgraves (40-120Hz) e inyecta GEOB:Serato BeatGrid oficial.
"""

import os
import sys
import time
import glob
import concurrent.futures

# Asegurar path al proyecto
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from infrastructure.audio_processor import AudioProcessorService

def procesar_un_archivo(path):
    try:
        # Analizar con corrección acústica de Beatgrid activa
        meta = AudioProcessorService.analizar_track_avanzado(path, verificar_beatgrid=True)
        bpm_val = meta.get("bpm")
        downbeat_ms = meta.get("first_downbeat_ms")
        ok = AudioProcessorService.escribir_metadatos_pro(path, meta)
        return {
            "path": path,
            "filename": os.path.basename(path),
            "bpm": bpm_val,
            "downbeat_ms": downbeat_ms,
            "success": ok
        }
    except Exception as e:
        return {
            "path": path,
            "filename": os.path.basename(path),
            "error": str(e),
            "success": False
        }

def main():
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "/Users/admin/Music/FLAC OK"
    if not os.path.exists(target_dir):
        print(f"[ERROR] Directorio no encontrado: {target_dir}")
        sys.exit(1)

    extensions = (".flac", ".mp3", ".wav", ".aiff", ".m4a")
    archivos = [
        os.path.join(target_dir, f) for f in os.listdir(target_dir)
        if not f.startswith(".") and f.lower().endswith(extensions)
    ]
    total = len(archivos)
    print(f"============================================================")
    print(f"🚀 INICIANDO REPARACIÓN MASIVA DE BEATGRIDS ACÚSTICOS SERATO")
    print(f"📁 Carpeta: {target_dir}")
    print(f"📦 Total de pistas: {total}")
    print(f"============================================================")

    t0 = time.time()
    num_workers = min(16, max(4, (os.cpu_count() or 4) * 2))
    completados = 0
    exitosos = 0
    fallidos = 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=num_workers) as executor:
        futures = {executor.submit(procesar_un_archivo, p): p for p in archivos}
        for future in concurrent.futures.as_completed(futures):
            completados += 1
            res = future.result()
            if res.get("success"):
                exitosos += 1
            else:
                fallidos += 1

            if completados % 25 == 0 or completados == total:
                elapsed = time.time() - t0
                pct = (completados / total) * 100.0
                rate = completados / elapsed if elapsed > 0 else 0.0
                print(f"[{completados:3d}/{total}] ({pct:5.1f}%) | Velocidad: {rate:.1f} pistas/s | OK: {exitosos} | Err: {fallidos}")

    t_total = time.time() - t0
    rate_final = total / t_total if t_total > 0 else 0.0
    print(f"\n============================================================")
    print(f"✅ PROCESO COMPLETADO EN: {t_total:.2f} s ({rate_final:.1f} pistas/s)")
    print(f"🛡️ Pistas inyectadas con Serato BeatGrid 1.0.0: {exitosos} de {total}")
    print(f"============================================================\n")

if __name__ == "__main__":
    main()
