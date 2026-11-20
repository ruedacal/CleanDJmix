#!/usr/bin/env python3
"""
Script de Procesamiento en Lote de Hot Cues Sparse y Beatgrid de Estudio.
Aplica el cálculo acústico de Hot Cues Estándar (Sparse Cues de 4 a 8 pads con fraseo
estricto de >= 16 compases y anclaje al corte de bombo) a todos los archivos FLAC/MP3
del directorio especificado.
"""

import os
# Desactivar sub-hilos en OpenBLAS/MKL para evitar contención con multiproceso
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import sys
import glob
import time
import json
from concurrent.futures import ProcessPoolExecutor, as_completed

# Asegurar path al proyecto
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from services.audit_service import AuditService


def _procesar_pista_worker(filepath: str) -> dict:
    fname = os.path.basename(filepath)
    try:
        svc = AuditService()
        res = svc.guardar_modo_hot_cues(filepath, modo="estandar")
        status = res.get("status", "ok")
        return {
            "file": fname,
            "path": filepath,
            "status": status,
            "msg": res.get("msg", "")
        }
    except Exception as e:
        return {
            "file": fname,
            "path": filepath,
            "status": "error",
            "msg": str(e)
        }


def main():
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "/Users/admin/Music/FLAC OK"
    if not os.path.exists(target_dir):
        print(f"[ERROR] Directorio no encontrado: {target_dir}", flush=True)
        sys.exit(1)

    flacs = glob.glob(os.path.join(target_dir, "*.flac"))
    mp3s = glob.glob(os.path.join(target_dir, "*.mp3"))
    all_files = sorted(flacs + mp3s)
    total_files = len(all_files)

    print(f"============================================================", flush=True)
    print(f"🚀 INICIANDO ACTUALIZACIÓN EN LOTE DE HOT CUES SPARSE", flush=True)
    print(f"📁 Directorio: {target_dir}", flush=True)
    print(f"🎵 Total pistas: {total_files} ({len(flacs)} FLACs, {len(mp3s)} MP3s)", flush=True)
    print(f"⚡ CPU Workers: 10 procesos paralelos (BLAS single-thread)", flush=True)
    print(f"============================================================", flush=True)

    t_start = time.time()
    completados = 0
    errores = 0
    summary = []

    with ProcessPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(_procesar_pista_worker, f): f for f in all_files}
        for future in as_completed(futures):
            res = future.result()
            completados += 1
            if res["status"] != "ok":
                errores += 1
                print(f"  [ERROR] {res['file']}: {res['msg']}", flush=True)
            else:
                summary.append(res)

            if completados % 10 == 0 or completados == total_files:
                elapsed = time.time() - t_start
                rate = completados / elapsed if elapsed > 0 else 1.0
                eta_sec = (total_files - completados) / rate if rate > 0 else 0
                pct = (completados / total_files) * 100.0
                print(f"  [{completados:3d}/{total_files:3d}] ({pct:5.1f}%) | "
                      f"Velocidad: {rate:.1f} trk/s | ETA: {eta_sec/60:.1f}m | OK: {completados - errores} | ERR: {errores}", flush=True)

    t_total = time.time() - t_start
    print(f"============================================================", flush=True)
    print(f"✓ PROCESAMIENTO COMPLETADO", flush=True)
    print(f"⏱ Tiempo total: {t_total/60:.2f} minutos ({t_total/total_files:.2f}s/pista)", flush=True)
    print(f"✓ Exitosos: {len(summary)}", flush=True)
    print(f"✗ Errores: {errores}", flush=True)
    print(f"============================================================", flush=True)

    # Guardar resumen JSON
    summary_path = os.path.join(BASE_DIR, "batch_sparse_cues_summary.json")
    try:
        with open(summary_path, "w", encoding="utf-8") as f_out:
            json.dump({
                "fecha": time.strftime("%Y-%m-%d %H:%M:%S"),
                "total": total_files,
                "exitosos": len(summary),
                "errores": errores,
                "tiempo_segundos": round(t_total, 2)
            }, f_out, indent=2)
        print(f"Resumen guardado en: {summary_path}", flush=True)
    except Exception:
        pass


if __name__ == "__main__":
    main()
