import sys
import os
from unittest.mock import patch, MagicMock
import pytest

# 1. MOCK DE EEL TRANSPARENTE
mock_eel = MagicMock()
def mock_expose(*args, **kwargs):
    if len(args) == 1 and callable(args[0]):
        return args[0]
    return lambda f: f
mock_eel.expose = mock_expose
sys.modules['eel'] = mock_eel

# 2. MOCK DE BOTTLE TRANSPARENTE
mock_bottle = MagicMock()
def mock_route(*args, **kwargs):
    return lambda f: f
mock_bottle.route = mock_route
sys.modules['bottle'] = mock_bottle

import main_web

# --- REPRODUCTOR NATIVO ---
@patch.object(main_web.audio_playback_svc, 'reproducir_mac')
def test_reproducir_pista_mac_exito(mock_reproducir):
    main_web.reproducir_pista_mac("track.flac")
    mock_reproducir.assert_called_with("track.flac")

@patch.object(main_web.audio_playback_svc, 'detener_mac')
def test_detener_audio(mock_detener):
    main_web.detener_audio_mac()
    mock_detener.assert_called_once()

# --- SELECCIÓN DE DIRECTORIO ---
@patch.object(main_web.audit_svc, 'seleccionar_directorio', return_value="/Mock/Dir")
def test_seleccionar_directorio_exito(mock_sel):
    assert main_web.seleccionar_directorio() == "/Mock/Dir"

# --- AUDITORÍA ---
@patch.object(main_web.audit_svc, 'iniciar_auditoria', return_value={"total": 10, "tracks": []})
def test_iniciar_auditoria_full(mock_audit):
    res = main_web.iniciar_auditoria('/Mock')
    assert res["total"] == 10

def test_iniciar_auditoria_invalido():
    assert main_web.iniciar_auditoria("")["total"] == 0

# --- STREAM AUDIO Y CARÁTULAS ---
@patch.object(main_web.media_svc, 'obtener_caratula_binaria', return_value=(b"img", "image/jpeg"))
@patch('main_web.bottle.request')
def test_get_cover_flac(mock_request, mock_media):
    mock_request.query.get.return_value = "t.flac"
    assert main_web.get_cover() == b"img"

@patch.object(main_web.media_svc, 'obtener_caratula_binaria', return_value=(None, None))
@patch('main_web.bottle.redirect', return_value="REDIRECT")
@patch('main_web.bottle.request')
def test_get_cover_fallback(mock_request, mock_redirect, mock_media):
    mock_request.query.get.return_value = "unknown.flac"
    assert main_web.get_cover() == "REDIRECT"

# --- EXPORTACIÓN XLS ---
@patch.object(main_web.export_svc, 'exportar_tracks_xls', return_value={"status": "ok", "path": "/Mock/file.csv"})
def test_exportar_auditoria_xls(mock_export):
    res = main_web.exportar_auditoria_xls([{"titulo": "Test"}])
    assert res["status"] == "ok"

# --- GUARDAR CAMBIOS TRACK & INYECCIÓN LOTE ---
def test_guardar_cambios_track_vacio():
    res = main_web.guardar_cambios_track(None)
    assert res["status"] == "error"

@patch.object(main_web.audit_svc, 'inyectar_lote_metadatos', return_value={"status": "ok", "inyectados": 5})
def test_inyectar_lote_metadatos(mock_inyectar):
    res = main_web.inyectar_lote_metadatos([{"title": "Track 1"}])
    assert res["status"] == "ok"
    assert res["inyectados"] == 5

# --- WRAPPERS ---
@patch.object(main_web.media_svc, 'analizar_catalogo_spotify', return_value=[])
def test_wrappers(mock_spotify):
    main_web.analizar_url_spotify("url")
    mock_spotify.assert_called_with("url")
    main_web.analizar_catalogo_spotify("url")
    main_web.log_to_console("Test")
    res_enr = main_web.enriquecer_pista_local("path")
    assert res_enr["status"] == "ok"

@patch.object(main_web.audit_svc, 'analizar_trim_downbeat', return_value={"status": "ok", "trim_start_ms": 15.0, "first_downbeat_ms": 500.0})
def test_calcular_trim_downbeat_track(mock_trim):
    res = main_web.calcular_trim_downbeat_track("/path/to/audio.mp3", track_id=1)
    assert res["status"] == "ok"
    assert res["trim_start_ms"] == 15.0
    assert res["first_downbeat_ms"] == 500.0
    mock_trim.assert_called_with("/path/to/audio.mp3", 1)

# --- TAXONOMÍA Y ENRUTAMIENTO CRATES ---
def test_obtener_taxonomia_dj_exposed():
    arbol = main_web.obtener_taxonomia_dj()
    assert isinstance(arbol, dict)
    assert "Techno" in arbol

def test_organizar_pista_en_crate_invalido():
    res = main_web.organizar_pista_en_crate(None)
    assert res["status"] == "error"

@patch.object(main_web.taxonomy_svc, 'organizar_pista', return_value={"estado": "OK", "ruta_destino": "/crates/Techno/track.mp3"})
def test_organizar_pista_en_crate_valido(mock_org, tmp_path):
    f = tmp_path / "track.mp3"
    f.touch()
    res = main_web.organizar_pista_en_crate({"path": str(f), "title": "Test Track", "genre": "Techno", "subgenre": "Peak Time"}, ruta_base=str(tmp_path))
    assert res["status"] == "ok"

@patch.object(main_web.taxonomy_svc, 'organizar_lote', return_value={"status": "ok", "procesados": 3})
def test_organizar_lote_en_crates_exposed(mock_org):
    res = main_web.organizar_lote_en_crates([{"path": "/mock/1.mp3"}], ruta_base="/dest")
    assert res["status"] == "ok"
    assert res["procesados"] == 3
