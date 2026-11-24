#!/usr/bin/env python3
"""Diagnóstico solo-lectura de Serato SQLite, Tags (Carátula + Markers2) y CoreMIDI NV II."""

from __future__ import annotations

import base64
import sqlite3
import struct
import unicodedata
from pathlib import Path
from typing import Any

import mido
from mutagen import File as MutagenFile
from mutagen.flac import FLAC
from mutagen.id3 import ID3
from mutagen.mp4 import MP4

SERATO_DB = Path.home() / "Library/Application Support/Serato/Library/master.sqlite"


def resolve_serato_path(raw_path: str) -> Path | None:
    """Resuelve rutas relativas/NFD/NFC de Serato en macOS."""
    if not raw_path:
        return None
    candidates = [
        raw_path,
        f"/{raw_path.lstrip('/')}",
        unicodedata.normalize("NFC", raw_path),
        unicodedata.normalize("NFD", raw_path),
        unicodedata.normalize("NFC", f"/{raw_path.lstrip('/')}"),
        unicodedata.normalize("NFD", f"/{raw_path.lstrip('/')}"),
    ]
    for candidate in candidates:
        p = Path(candidate)
        if p.is_file():
            return p
    return None


def decode_serato_markers2(raw_b64_bytes: bytes) -> list[dict[str, Any]]:
    """Decodifica entradas CUE desde el payload Base64 de Serato Markers2."""
    cleaned = raw_b64_bytes.replace(b"\n", b"").replace(b"\r", b"").strip(b"\x00 ")
    pad = (-len(cleaned)) % 4
    payload = base64.b64decode(cleaned + (b"=" * pad))

    marker_sig = b"Serato Markers2\x00"
    if marker_sig in payload:
        payload = payload.split(marker_sig, 1)[1]

    if payload.startswith(b"\x01\x01"):
        payload = payload[2:]

    cues: list[dict[str, Any]] = []
    offset = 0
    total = len(payload)

    while offset < total:
        null_idx = payload.find(b"\x00", offset)
        if null_idx == -1 or null_idx == offset:
            break
        entry_type = payload[offset:null_idx].decode("ascii", errors="ignore")
        offset = null_idx + 1
        if offset + 4 > total:
            break
        entry_len = struct.unpack(">I", payload[offset : offset + 4])[0]
        offset += 4
        entry_data = payload[offset : offset + entry_len]
        offset += entry_len

        if entry_type == "CUE" and len(entry_data) >= 13:
            cue_index = entry_data[1]
            pos_ms = struct.unpack(">I", entry_data[2:6])[0]
            label = entry_data[12:].split(b"\x00", 1)[0].decode("utf-8", errors="ignore")
            cues.append(
                {
                    "index": cue_index,
                    "pos_ms": pos_ms,
                    "pos_sec": round(pos_ms / 1000.0, 3),
                    "label": label,
                }
            )
    return cues


def inspect_audio_file(audio_path: Path) -> dict[str, Any]:
    """Comprueba presencia de carátula y CUEs Serato Markers2 en MP3/FLAC/MP4."""
    result: dict[str, Any] = {
        "file": str(audio_path),
        "has_artwork": False,
        "artwork_mime": None,
        "artwork_bytes": 0,
        "cues": [],
        "raw_marker_source": None,
    }
    audio = MutagenFile(audio_path)
    if audio is None:
        result["error"] = "Mutagen no reconoce el formato"
        return result

    tags = getattr(audio, "tags", None)

    if isinstance(tags, ID3):
        for key, frame in tags.items():
            if key.startswith("APIC:"):
                result["has_artwork"] = True
                result["artwork_mime"] = frame.mime
                result["artwork_bytes"] = len(frame.data)
            elif key.startswith("GEOB:") and getattr(frame, "desc", "") == "Serato Markers2":
                data = frame.data[2:] if frame.data.startswith(b"\x01\x01") else frame.data
                result["raw_marker_source"] = "ID3:GEOB:Serato Markers2"
                result["cues"] = decode_serato_markers2(data)

    elif isinstance(audio, FLAC):
        if audio.pictures:
            pic = audio.pictures[0]
            result["has_artwork"] = True
            result["artwork_mime"] = pic.mime
            result["artwork_bytes"] = len(pic.data)
        if "serato_markers_v2" in audio:
            raw = audio["serato_markers_v2"][0].encode("ascii")
            result["raw_marker_source"] = "FLAC:serato_markers_v2"
            result["cues"] = decode_serato_markers2(raw)

    elif isinstance(audio, MP4) and tags is not None:
        if "covr" in tags and tags["covr"]:
            result["has_artwork"] = True
            result["artwork_mime"] = "image/mp4-covr"
            result["artwork_bytes"] = len(tags["covr"][0])
        m_key = "----:com.serato.dj:markersv2"
        if m_key in tags and tags[m_key]:
            result["raw_marker_source"] = f"MP4:{m_key}"
            result["cues"] = decode_serato_markers2(bytes(tags[m_key][0]))

    return result


def audit_serato_sqlite() -> None:
    """Inspecciona sesión activa, columnas de deck y estado de archivos físicos."""
    print(f"\n=== 1. SERATO SQLITE ({SERATO_DB}) ===")
    if not SERATO_DB.exists():
        print("ERROR: No existe master.sqlite en la ruta esperada.")
        return

    uri = f"file:{SERATO_DB}?mode=ro"
    with sqlite3.connect(uri, uri=True) as conn:
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        session = cur.execute(
            "SELECT id, start_time, end_time FROM history_session WHERE end_time = -1 ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if not session:
            print("AVISO: No hay sesión activa (end_time = -1). Abre Serato y carga 2 pistas.")
            return

        print(f"Sesión activa ID={session['id']}")
        rows = cur.execute(
            "SELECT * FROM history_entry WHERE session_id = ? AND end_time = -1 ORDER BY id DESC",
            (session["id"],),
        ).fetchall()
        print(f"Entradas activas con end_time = -1: {len(rows)}")

        for row in rows:
            row_dict = dict(row)
            deck = row_dict.get("deck")
            played = row_dict.get("played")
            raw_path = row_dict.get("file_path") or row_dict.get("location") or ""
            print(f"\n--- Deck={deck} | played={played} | raw_path={raw_path!r} ---")
            resolved = resolve_serato_path(str(raw_path))
            if not resolved:
                print("ERROR RUTA: El archivo físico NO existe con la ruta devuelta por SQLite.")
                continue
            print(f"Ruta resuelta OK: {resolved}")
            info = inspect_audio_file(resolved)
            print(
                f"Carátula: {info['has_artwork']} ({info['artwork_mime']}, {info['artwork_bytes']} bytes)"
            )
            print(f"Fuente CUEs: {info['raw_marker_source']} | CUEs encontrados: {info['cues']}")


def sniff_nv2_midi() -> None:
    """Escucha eventos crudos CoreMIDI de la Numark NV II."""
    print("\n=== 2. SNIFFER COREMIDI (NUMARK NV II) ===")
    ports = mido.get_input_names()
    print(f"Puertos MIDI detectados: {ports}")
    target = next((p for p in ports if "NV" in p or "Numark" in p), None)
    if not target:
        print("ERROR: No se detectó puerto NV mkII Control.")
        return

    print(f"Escuchando en: {target}")
    print(
        "Pulsa en orden: [1] Play Deck 1, [2] CUE Deck 1, [3] Play Deck 2, "
        "[4] CUE Deck 2, [5] Hot Cue 1 en Deck 1 y 2. (Ctrl+C para salir)\n"
    )
    with mido.open_input(target) as port:
        for msg in port:
            val = getattr(msg, "velocity", getattr(msg, "value", None))
            code = getattr(msg, "note", getattr(msg, "control", None))
            print(
                f"type={msg.type:<14} ch={getattr(msg, 'channel', '-'):<2} "
                f"code={str(code):<4} val={val}"
            )


if __name__ == "__main__":
    audit_serato_sqlite()
    try:
        sniff_nv2_midi()
    except KeyboardInterrupt:
        print("\nDiagnóstico finalizado.")
