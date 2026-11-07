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
@patch('main_web.bottle.request')
def test_get_cover_fallback(mock_request, mock_media):
    mock_request.query.get.return_value = "unknown.flac"
    res = main_web.get_cover()
    assert res.startswith(b'<svg')

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

@patch.object(main_web.audit_svc, 'inyectar_caratulas_lote', return_value={"status": "ok", "actualizadas": 5})
def test_inyectar_caratulas_lote_exposed(mock_inyectar_c):
    res = main_web.inyectar_caratulas_lote([{"title": "Track 1"}])
    assert res["status"] == "ok"
    assert res["actualizadas"] == 5

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

@patch.object(main_web.export_svc, 'exportar_serato_crates', return_value={"status": "ok", "total_crates": 4})
def test_exportar_serato_crates_exposed(mock_exp):
    res = main_web.exportar_serato_crates([{"title": "Track"}])
    assert res["status"] == "ok"
    assert res["total_crates"] == 4

@patch.object(main_web.export_svc, 'exportar_rekordbox_xml', return_value={"status": "ok", "path": "/mock/rekordbox.xml"})
def test_exportar_rekordbox_xml_exposed(mock_exp):
    res = main_web.exportar_rekordbox_xml([{"title": "Track"}])
    assert res["status"] == "ok"
    assert res["path"] == "/mock/rekordbox.xml"

def test_regenerar_mood_y_comentario_exposed():
    mock_track = {
        "title": "Solar Detroit",
        "artist": "Maceo Plex",
        "bpm": "125.0",
        "key": "8A",
        "energy": 86,
        "danceability": 88
    }
    res_es = main_web.regenerar_mood_y_comentario(mock_track, lang="es")
    assert res_es["status"] == "ok"
    assert "mood" in res_es
    assert "comment" in res_es
    assert "Intro 32b" in res_es["comment"]

    res_en = main_web.regenerar_mood_y_comentario(mock_track, lang="en")
    assert res_en["status"] == "ok"
    assert "Intro 32b" in res_en["comment"]

def test_regenerar_mood_y_comentario_invalido():
    res = main_web.regenerar_mood_y_comentario(None)
    assert res["status"] == "error"

@patch.object(main_web.audit_svc, 'detectar_duplicados_biblioteca', return_value={"total_grupos": 1, "grupos": []})
def test_detectar_duplicados_biblioteca_exposed(mock_dup):
    res = main_web.detectar_duplicados_biblioteca([{"title": "Track"}])
    assert res["total_grupos"] == 1

@patch.object(main_web.audit_svc, 'eliminar_pistas_duplicadas', return_value={"status": "ok", "eliminados": 1})
def test_eliminar_pistas_duplicadas_exposed(mock_del):
    res = main_web.eliminar_pistas_duplicadas(["/mock/path.mp3"])
    assert res["status"] == "ok"
    assert res["eliminados"] == 1

@patch.object(main_web.media_svc, 'buscar_reemplazos_spotify_batch', return_value={"status": "ok", "tracks": [{"title": "Titanium", "artist": "David Guetta"}], "count": 1})
def test_buscar_reemplazos_spotify_batch_exposed(mock_batch):
    res = main_web.buscar_reemplazos_spotify_batch([{"title": "Titanium", "artist": "David Guetta"}])
    assert res["status"] == "ok"
    assert res["count"] == 1
    assert res["tracks"][0]["title"] == "Titanium"

def test_cargar_metadatos_directorio_con_lista_archivos(tmp_path):
    f1 = tmp_path / "Artist 1 - Song 1.mp3"
    f1.write_bytes(b"\x00" * 500)
    f2 = tmp_path / "Artist 2 - Song 2.flac"
    f2.write_bytes(b"\x00" * 500)

    res = main_web.cargar_metadatos_directorio([str(f1), str(f2)])
    assert res["total"] == 2
    assert len(res["tracks"]) == 2

def test_exportar_reporte_descargas_xls_exposed(tmp_path):
    report_data = {
        "downloaded": [{"title": "Track 1", "artist": "DJ 1", "format": "FLAC", "status": "Lossless OK"}],
        "failed": [{"title": "Track 2", "artist": "DJ 2", "error": "Not Found"}]
    }
    res = main_web.exportar_reporte_descargas_xls(report_data, destino_dir=str(tmp_path))
    assert res["status"] == "ok"
    assert res["descargadas"] == 1
    assert res["fallidas"] == 1
    assert os.path.exists(res["path"])

@patch.object(main_web.shazam_svc, 'reconocer_base64', return_value={"status": "ok", "title": "Horny Tiger", "artist": "Marco Bailey"})
def test_identificar_audio_base64_con_filename(mock_rec):
    res = main_web.identificar_audio_base64("b64dummydata", motor="hybrid", filename="Marco Bailey - Horny Tiger.mp3")
    assert res["status"] == "ok"
    assert res["title"] == "Horny Tiger"
    mock_rec.assert_called_once_with("b64dummydata", motor="hybrid", audd_token="", filename="Marco Bailey - Horny Tiger.mp3")

# --- NUEVAS RUTAS HTTP SPOTIFY INGEST & TENDENCIAS ---
@patch.object(main_web.download_svc, 'ejecutar_lote_descarga', return_value={"status": "ok", "total": 1})
@patch('main_web.bottle.request')
def test_api_descargar_spotify(mock_req, mock_dl):
    mock_req.method = 'POST'
    mock_req.json = {'tracks': [{'title': 'Track 1'}], 'formato': 'flac', 'custom_dir': '/tmp'}
    res = main_web.api_descargar_spotify()
    assert res["status"] == "ok"
    mock_dl.assert_called_once()

@patch.object(main_web.audit_svc, 'listar_subcarpetas_sistema', return_value={"current": "/Music", "parent": "/", "folders": []})
@patch('main_web.bottle.request')
def test_api_listar_subcarpetas(mock_req, mock_sub):
    mock_req.method = 'GET'
    mock_req.query.get.return_value = "/Music"
    mock_req.json = None
    res = main_web.api_listar_subcarpetas()
    assert res["current"] == "/Music"
    mock_sub.assert_called_once_with("/Music")

@patch.object(main_web.download_svc, 'obtener_directorio_actual', return_value="/Users/admin/Music")
@patch('main_web.bottle.request')
def test_api_directorio_descarga(mock_req, mock_dir):
    mock_req.method = 'GET'
    mock_req.json = None
    res = main_web.api_directorio_descarga()
    assert res["status"] == "ok"
    assert res["path"] == "/Users/admin/Music"

@patch.object(main_web.media_svc, 'resolver_stream_preescucha', return_value={"stream_url": "http://stream.mp3", "cover": "http://img.jpg"})
@patch('main_web.bottle.request')
def test_api_resolver_stream_preescucha(mock_req, mock_resolve):
    mock_req.method = 'GET'
    mock_req.query.get.side_effect = lambda k, default='': 'Song' if k == 'titulo' else ('Artist' if k == 'artista' else default)
    mock_req.json = None
    res = main_web.api_resolver_stream_preescucha()
    assert res["stream_url"] == "http://stream.mp3"
    mock_resolve.assert_called_once_with('Song', 'Artist')

def test_trends_service_enriched_sections():
    from services.trends_service import trends_service
    data = trends_service.obtener_tendencias()
    assert "items" in data
    assert "festivals_calendar" in data
    assert len(data["festivals_calendar"]) >= 5
    assert "set_breakdowns" in data
    assert len(data["set_breakdowns"]) >= 3
    assert "interviews" in data
    assert len(data["interviews"]) >= 3
    assert "trends_radar" in data
    assert len(data["trends_radar"]) >= 3

def test_cargar_metadatos_lista_heterogenea_carpetas_y_archivos():
    import tempfile
    with tempfile.TemporaryDirectory() as dir1:
        f1 = os.path.join(dir1, "track_folder.mp3")
        with open(f1, "wb") as f:
            f.write(b"ID3" + b"\x00" * 500)
        with tempfile.TemporaryDirectory() as dir2:
            f2 = os.path.join(dir2, "track_loose.wav")
            with open(f2, "wb") as f:
                f.write(b"RIFF" + b"\x00" * 500)

            # Cesta mixta: [carpeta dir1, pista suelta f2]
            res = main_web.audit_svc.cargar_metadatos_directorio([dir1, f2])
            assert res["total"] == 2
            nombres = [t["filename"] for t in res["tracks"]]
            assert "track_folder.mp3" in nombres
            assert "track_loose.wav" in nombres

def test_api_copilot_status_and_info():
    import json
    res_status_raw = main_web.api_copilot_status()
    res_status = json.loads(res_status_raw)
    assert "connected" in res_status
    assert "deck_1" in res_status
    assert "deck_2" in res_status
    assert "anti_muddy" in res_status
    assert "platform" in res_status

    res_info_raw = main_web.api_copilot_info()
    res_info = json.loads(res_info_raw)
    assert "local_ip" in res_info
    assert "companion_url" in res_info
    assert "platforms" in res_info

def test_api_copilot_platforms_and_set():
    import json
    res_plats_raw = main_web.api_copilot_platforms()
    res_plats = json.loads(res_plats_raw)
    assert "platforms" in res_plats
    assert len(res_plats["platforms"]) == 4

    # Test eel set platform
    state = main_web.eel_copilot_set_platform("rekordbox")
    assert state["platform"] == "rekordbox"
    assert state["platform_name"] == "Pioneer Rekordbox"

    # Reset to auto
    main_web.eel_copilot_set_platform("auto")

def test_eel_copilot_exposures():
    state = main_web.eel_copilot_get_state()
    assert state["connected"] is True
    info = main_web.eel_copilot_get_info()
    assert "companion_url" in info
    assert "platforms" in info
    plats = main_web.eel_copilot_get_platforms()
    assert len(plats["platforms"]) == 4



