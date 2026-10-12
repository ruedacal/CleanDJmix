"""
Pruebas unitarias exhaustivas para AudioAdapter y SpotDLAdapter (cobertura >90%).
"""

import os
import pytest
from unittest.mock import patch, MagicMock
import numpy as np
from infrastructure.adapters import AudioAdapter, SpotDLAdapter
from domain.models import TrackDomain

# --- PRUEBAS DE DOMINIO ---
def test_limpiar_texto():
    assert "spotdown" not in TrackDomain.limpiar_texto("12._spotdown.org_Artist_-_Title.mp3")

def test_cerebro_ishkur():
    gen, sub = TrackDomain.cerebro_ishkur(145, 2026, ["hard techno"], 500, 0.09, 3000)
    assert gen == "Techno" and sub == "Hard Techno"

    gen2, sub2 = TrackDomain.cerebro_ishkur(126, 2026, ["tech house"], 500, 0.05, 2000)
    assert gen2 == "Tech House" and sub2 == "Tech House"

# --- PRUEBAS DE AUDIO ADAPTER ---
def test_audio_adapter_id3_fallback():
    with patch('infrastructure.adapters.EasyID3') as mock_id3:
        mock_id3.side_effect = Exception()
        art, tit = AudioAdapter.obtener_metadatos_id3("/path/Art - Tit.mp3", "Art - Tit.mp3")
        assert art == "Art" and tit == "Tit"

@patch('infrastructure.adapters.requests.get')
def test_audio_adapter_discogs(mock_get):
    resp = MagicMock()
    resp.status_code = 200
    resp.json.return_value = {'results': [{'year': '2024', 'style': ['Techno'], 'title': 'A - B'}]}
    mock_get.return_value = resp
    año, estilos, art, tit = AudioAdapter.buscar_discogs("A", "B")
    assert año == 2024 and art == "A"

@patch('infrastructure.adapters.librosa.load')
def test_analizar_acustica_error(mock_load):
    mock_load.side_effect = Exception()
    bpm, _, _, _, _, _ = AudioAdapter.analizar_acustica("err.mp3")
    assert bpm == 128.0

@patch('infrastructure.adapters.Shazam')
def test_rescate_shazam(mock_shz):
    inst = MagicMock()
    async def ok(r): return {'track': {'subtitle': 'Art', 'title': 'Tit'}}
    inst.recognize_song = ok
    mock_shz.return_value = inst
    art, tit = AudioAdapter.rescate_shazam("test.mp3")
    assert art == "Art"

def test_actualizar_fichero_csv():
    nom = AudioAdapter.actualizar_fichero("t.mp3", "A", "T", 2025, 128, modo_seguro=True)
    assert "A - T.mp3" in nom
    csv_f = AudioAdapter.exportar_informe_csv([{'artista':'A','titulo':'T','bpm':128,'anio':2025,'genero':'G','subgenero':'S','ruta_final':'/tmp/t.mp3'}], '/tmp')
    assert csv_f is not None

# --- PRUEBAS UNITARIAS DE SPOTDL (PRE-ESCANEO Y DESCARGA SELECTIVA) ---
def test_spotdl_escanear_lista_exito():
    mock_spotdl_mod = MagicMock()
    inst = MagicMock()
    cancion = MagicMock()
    cancion.name = "Track VIP"
    cancion.artist = "DJ Producer"
    cancion.album_name = "Summer EP"
    cancion.duration = 195  # 3m 15s
    cancion.cover_url = "https://cover.img/1.jpg"
    inst.search.return_value = [cancion]
    mock_spotdl_mod.Spotdl.return_value = inst

    logs = []
    with patch.dict('sys.modules', {'spotdl': mock_spotdl_mod}):
        res = SpotDLAdapter.escanear_lista("https://open.spotify.com/playlist/test", callback_log=lambda m, t="info": logs.append(m))
        assert len(res) == 1
        assert res[0]["titulo"] == "Track VIP"
        assert res[0]["artista"] == "DJ Producer"
        assert res[0]["album"] == "Summer EP"
        assert res[0]["duracion"] == "03:15"
        assert len(logs) > 0

def test_spotdl_escanear_lista_error():
    logs = []
    with patch.dict('sys.modules', {'spotdl': None}):
        res = SpotDLAdapter.escanear_lista("url_invalida", callback_log=lambda m, t="info": logs.append(m))
        assert res == []
        assert any("Error" in log for log in logs)

@patch('os.listdir')
def test_spotdl_descargar_seleccionadas_exito(mock_ls):
    mock_ls.side_effect = [
        ["antiguo.mp3"],
        ["antiguo.mp3", "DJ Producer - Track VIP.mp3", "cover.jpg"]
    ]
    mock_spotdl_mod = MagicMock()
    inst = MagicMock()
    mock_spotdl_mod.Spotdl.return_value = inst

    logs = []
    with patch.dict('sys.modules', {'spotdl': mock_spotdl_mod}):
        canciones_marcadas = [MagicMock()]
        nuevos = SpotDLAdapter.descargar_canciones_seleccionadas(
            canciones_marcadas,
            "/tmp/descargas",
            callback_log=lambda m, t="info": logs.append(m)
        )
        assert len(nuevos) == 1
        assert nuevos[0].endswith("DJ Producer - Track VIP.mp3")
        assert any("completada" in log for log in logs)

def test_spotdl_descargar_seleccionadas_error():
    logs = []
    with patch.dict('sys.modules', {'spotdl': None}):
        nuevos = SpotDLAdapter.descargar_canciones_seleccionadas(
            ["dummy_song"],
            "/tmp/descargas",
            callback_log=lambda m, t="info": logs.append(m)
        )
        assert nuevos == []
        assert any("Error" in log for log in logs)
