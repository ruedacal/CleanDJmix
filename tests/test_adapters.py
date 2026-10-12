"""
Suite de pruebas unitarias exhaustivas para AudioAdapter y SpotDLAdapter.
Diseñada para superar el 90% de cobertura cubriendo rutas nominales y de fallo.
"""

import os
import pytest
from unittest.mock import patch, MagicMock
import numpy as np
from infrastructure.adapters import AudioAdapter, SpotDLAdapter
from domain.models import TrackDomain

# --- PRUEBAS DE DOMINIO ---

def test_limpiar_texto_avanzado():
    assert "spotdown" not in TrackDomain.limpiar_texto("12._spotdown.org_Artist_-_Title.mp3")
    assert TrackDomain.limpiar_texto("") == ""
    assert TrackDomain.limpiar_texto(None) == ""

def test_cerebro_ishkur_rutas_completas():
    # Hard Techno
    g, s = TrackDomain.cerebro_ishkur(145, 2026, ["hard techno"], 500, 0.09, 3000)
    assert g == "Techno" and s == "Hard Techno"

    # Melodic Techno
    g, s = TrackDomain.cerebro_ishkur(126, 2026, ["melodic techno"], 500, 0.05, 2000)
    assert g == "Techno" and s == "Melodic Techno"

    # Acid Techno
    g, s = TrackDomain.cerebro_ishkur(130, 2026, ["acid"], 500, 0.05, 2000)
    assert g == "Techno" and s == "Acid Techno"

    # Tech House
    g, s = TrackDomain.cerebro_ishkur(126, 2026, ["tech house"], 500, 0.05, 2000)
    assert g == "Tech House" and s == "Tech House"

    # Deep House
    g, s = TrackDomain.cerebro_ishkur(122, 2026, ["deep house"], 500, 0.05, 2000)
    assert g == "House" and s == "Deep House"

    # Afro House
    g, s = TrackDomain.cerebro_ishkur(120, 2026, ["afro house"], 500, 0.05, 2000)
    assert g == "House" and s == "Afro House"

    # Psy-Trance
    g, s = TrackDomain.cerebro_ishkur(142, 2026, ["psy-trance"], 500, 0.05, 2000)
    assert g == "Trance" and s == "Psy-Trance"

    # Vocal Trance
    g, s = TrackDomain.cerebro_ishkur(130, 2026, ["vocal"], 3000, 0.05, 2000)
    assert g == "Vocales (Cantaditas)" and s == "Vocal Trance"

    # Hardstyle
    g, s = TrackDomain.cerebro_ishkur(150, 2026, ["hardstyle"], 500, 0.05, 2000)
    assert g == "Hard Dance & Hardcore" and s == "Hardstyle"

    # Remember / Classic House
    g, s = TrackDomain.cerebro_ishkur(128, 1995, [], 500, 0.05, 2000)
    assert g == "Remember & Classics" and s == "Classic House"

    # Hardcore
    g, s = TrackDomain.cerebro_ishkur(160, 2026, [], 500, 0.05, 2000)
    assert g == "Hard Dance & Hardcore" and s == "Hardcore"

    # Uplifting Trance
    g, s = TrackDomain.cerebro_ishkur(138, 2026, [], 500, 0.05, 3000)
    assert g == "Trance" and s == "Uplifting Trance"

    # Minimal Techno
    g, s = TrackDomain.cerebro_ishkur(134, 2026, [], 500, 0.05, 1500)
    assert g == "Techno" and s == "Minimal Techno"

    # House genérico
    g, s = TrackDomain.cerebro_ishkur(122, 2026, ["house"], 500, 0.05, 1500)
    assert g == "House" and s == "Deep House"

    # Fallback default
    g, s = TrackDomain.cerebro_ishkur(110, 2026, [], 500, 0.05, 1000)
    assert g == "Tech House" and s == "Tech House"


# --- PRUEBAS DE AUDIOADAPTER ---

def test_audio_adapter_id3_exito():
    with patch('infrastructure.adapters.EasyID3') as mock_id3:
        mock_inst = MagicMock()
        mock_inst.get.side_effect = lambda key, default: ["Artista Real"] if key == "artist" else ["Titulo Real"]
        mock_id3.return_value = mock_inst
        art, tit = AudioAdapter.obtener_metadatos_id3("/path/real.mp3", "real.mp3")
        assert art == "Artista Real"
        assert tit == "Titulo Real"

def test_audio_adapter_id3_fallbacks():
    with patch('infrastructure.adapters.EasyID3') as mock_id3:
        mock_id3.side_effect = Exception("No ID3")
        
        art, tit = AudioAdapter.obtener_metadatos_id3("/path/Paul - For An Angel.mp3", "Paul - For An Angel.mp3")
        assert art == "Paul" and tit == "For An Angel"
        
        art2, tit2 = AudioAdapter.obtener_metadatos_id3("/path/Future Trance Vol 90.mp3", "Future Trance Vol 90.mp3")
        assert art2 == "Various Artists" and "Future Trance Vol 90" in tit2

        art3, tit3 = AudioAdapter.obtener_metadatos_id3("/path/track01.mp3", "track01.mp3")
        assert art3 == "VRC_MISSING" and tit3 == "VRC_MISSING"

@patch('infrastructure.adapters.requests.get')
def test_audio_adapter_discogs_rutas(mock_get):
    resp1 = MagicMock()
    resp1.status_code = 200
    resp1.json.return_value = {
        'results': [{
            'year': '2023',
            'style': ['Techno', 'Peak Time'],
            'title': 'Adam Beyer - Your Mind'
        }]
    }
    mock_get.return_value = resp1
    año, estilos, art, tit = AudioAdapter.buscar_discogs("Adam", "Your Mind")
    assert año == 2023
    assert art == "Adam Beyer"
    assert tit == "Your Mind"
    assert "techno" in estilos

    resp2 = MagicMock()
    resp2.status_code = 200
    resp2.json.return_value = {
        'results': [{
            'year': '2021',
            'style': ['Trance'],
            'title': 'TrackSingleName'
        }]
    }
    mock_get.return_value = resp2
    año2, _, art2, tit2 = AudioAdapter.buscar_discogs("Armin", "TrackSingleName")
    assert art2 == "Armin" and tit2 == "TrackSingleName"

    resp3 = MagicMock()
    resp3.status_code = 200
    resp3.json.return_value = {'results': []}
    mock_get.return_value = resp3
    año3, estilos3, art3, tit3 = AudioAdapter.buscar_discogs("Anon", "Vacio")
    assert año3 == 2026 and estilos3 == []

    mock_get.side_effect = Exception("Network timeout")
    año4, _, _, _ = AudioAdapter.buscar_discogs("Anon", "Error")
    assert año4 == 2026

@patch('infrastructure.adapters.librosa.load')
@patch('infrastructure.adapters.librosa.effects.trim')
@patch('infrastructure.adapters.librosa.beat.beat_track')
@patch('infrastructure.adapters.librosa.feature.rms')
@patch('infrastructure.adapters.librosa.onset.onset_strength')
@patch('infrastructure.adapters.librosa.feature.mfcc')
@patch('infrastructure.adapters.librosa.feature.zero_crossing_rate')
@patch('infrastructure.adapters.librosa.feature.spectral_centroid')
def test_audio_adapter_analisis_acustico_exito(mock_cent, mock_zcr, mock_mfcc, mock_onset, mock_rms, mock_beat, mock_trim, mock_load):
    mock_load.return_value = (np.zeros(100), 44100)
    mock_trim.return_value = (np.zeros(80), [10, 80])
    mock_beat.return_value = (np.array([126.5]), np.array([10]))
    mock_rms.return_value = np.array([[0.25]])
    mock_onset.return_value = np.array([0.6])
    mock_mfcc.return_value = np.zeros((13, 10))
    mock_zcr.return_value = np.array([[0.04]])
    mock_cent.return_value = np.array([[2200.0]])

    bpm, energia, groove, vocal, zcr, cent = AudioAdapter.analizar_acustica("/path/cancion.mp3")
    assert bpm == 126.5
    assert energia == 250
    assert groove == 0

def test_audio_adapter_analisis_acustico_error():
    with patch('infrastructure.adapters.librosa.load', side_effect=Exception("Decode error")):
        bpm, energia, groove, vocal, zcr, cent = AudioAdapter.analizar_acustica("/path/corrupto.mp3")
        assert bpm == 128.0
        assert energia == 50

@patch('infrastructure.adapters.Shazam')
def test_audio_adapter_shazam_rutas(mock_shz_cls):
    inst = MagicMock()
    async def ok(ruta): return {'track': {'subtitle': 'ShazamArt', 'title': 'ShazamTit'}}
    inst.recognize_song = ok
    mock_shz_cls.return_value = inst
    art, tit = AudioAdapter.rescate_shazam("/path/test.mp3")
    assert art == "ShazamArt" and tit == "ShazamTit"

    async def err(ruta): raise Exception("Shazam fail")
    inst.recognize_song = err
    art_err, tit_err = AudioAdapter.rescate_shazam("/path/test.mp3")
    assert art_err == "VRC_MISSING" and tit_err == "VRC_MISSING"

@patch('infrastructure.adapters.MutagenFile')
def test_audio_adapter_actualizar_fichero_modos(mock_mutagen):
    mock_audio = MagicMock()
    mock_mutagen.return_value = mock_audio

    nom1 = AudioAdapter.actualizar_fichero("/path/test.mp3", "DJ X", "Mix", 2024, 130, modo_seguro=True)
    assert nom1 == "DJ X - Mix.mp3"
    mock_audio.save.assert_not_called()

    nom2 = AudioAdapter.actualizar_fichero("/path/test.mp3", "DJ X", "Mix", 2024, 130, modo_seguro=False)
    assert nom2 == "DJ X - Mix.mp3"
    mock_audio.save.assert_called_once()

    nom3 = AudioAdapter.actualizar_fichero("/path/test.mp3", "VRC_MISSING", "VRC_MISSING", 2024, 138, modo_seguro=True)
    assert nom3 == "VRC_Unidentified_Track_138BPM.mp3"

    mock_mutagen.side_effect = Exception("Write error")
    nom4 = AudioAdapter.actualizar_fichero("/path/test.mp3", "Artist", "Song", 2024, 128, modo_seguro=False)
    assert nom4 == "Artist - Song.mp3"

def test_audio_adapter_exportar_csv(tmp_path):
    datos = [{
        'artista': 'TestArt', 'titulo': 'TestTit', 'bpm': 128.0,
        'anio': 2025, 'genero': 'Techno', 'subgenero': 'Hard Techno',
        'ruta_final': str(tmp_path / 'out.mp3')
    }]
    csv_file = AudioAdapter.exportar_informe_csv(datos, str(tmp_path))
    assert csv_file is not None
    assert os.path.exists(csv_file)

    csv_err = AudioAdapter.exportar_informe_csv(datos, "/directorio/inexistente/invalido")
    assert csv_err is None


# --- PRUEBAS DE SPOTDLADAPTER ---

def test_spotdl_obtener_instancia():
    mock_spotdl_mod = MagicMock()
    with patch.dict('sys.modules', {'spotdl': mock_spotdl_mod}):
        inst = SpotDLAdapter.obtener_instancia("/tmp/dest")
        assert inst is not None

def test_spotdl_escanear_lista_nominal():
    mock_spotdl_mod = MagicMock()
    mock_inst = MagicMock()
    
    song1 = MagicMock()
    song1.name = "Track Alpha"
    song1.artist = "Artist Alpha"
    song1.album_name = "Album Alpha"
    song1.duration = 205
    song1.cover_url = "http://cover1.jpg"

    song2 = MagicMock()
    song2.name = None
    song2.artist = None
    song2.album_name = None
    song2.duration = None
    song2.cover_url = None

    mock_inst.search.return_value = [song1, song2]
    mock_spotdl_mod.Spotdl.return_value = mock_inst

    logs = []
    with patch.dict('sys.modules', {'spotdl': mock_spotdl_mod}):
        res = SpotDLAdapter.escanear_lista("https://open.spotify.com/playlist/xyz", callback_log=lambda m, t="info": logs.append(m))
        assert len(res) == 2
        assert res[0]["titulo"] == "Track Alpha"
        assert res[0]["duracion"] == "03:25"
        assert res[1]["titulo"] == "Desconocido"
        assert res[1]["duracion"] == "00:00"
        assert len(logs) > 0

def test_spotdl_escanear_lista_sin_callback_y_error():
    mock_spotdl_mod = MagicMock()
    mock_inst = MagicMock()
    mock_inst.search.return_value = []
    mock_spotdl_mod.Spotdl.return_value = mock_inst
    with patch.dict('sys.modules', {'spotdl': mock_spotdl_mod}):
        res = SpotDLAdapter.escanear_lista("https://spotify.com/track/empty")
        assert res == []

    logs = []
    with patch.dict('sys.modules', {'spotdl': None}):
        res_err = SpotDLAdapter.escanear_lista("invalido", callback_log=lambda m, t="error": logs.append(m))
        assert res_err == []
        assert any("Error" in l for l in logs)

@patch('os.listdir')
def test_spotdl_descargar_seleccionadas_exito(mock_listdir):
    mock_listdir.side_effect = [
        ["prev.mp3"],
        ["prev.mp3", "Artist - NewTrack.mp3", "cover.jpg"]
    ]
    mock_spotdl_mod = MagicMock()
    mock_inst = MagicMock()
    mock_spotdl_mod.Spotdl.return_value = mock_inst

    logs = []
    with patch.dict('sys.modules', {'spotdl': mock_spotdl_mod}):
        res = SpotDLAdapter.descargar_canciones_seleccionadas(
            [MagicMock()],
            "/tmp/out",
            callback_log=lambda m, t="info": logs.append(m)
        )
        assert len(res) == 1
        assert res[0].endswith("Artist - NewTrack.mp3")
        assert any("completada" in l for l in logs)

@patch('os.listdir')
def test_spotdl_descargar_seleccionadas_sin_callback(mock_listdir):
    mock_listdir.side_effect = [
        [],
        ["Track.mp3"]
    ]
    mock_spotdl_mod = MagicMock()
    mock_inst = MagicMock()
    mock_spotdl_mod.Spotdl.return_value = mock_inst

    with patch.dict('sys.modules', {'spotdl': mock_spotdl_mod}):
        res = SpotDLAdapter.descargar_canciones_seleccionadas([MagicMock()], "/tmp/out")
        assert len(res) == 1

def test_spotdl_descargar_seleccionadas_error():
    logs_err = []
    with patch.dict('sys.modules', {'spotdl': None}):
        res_err = SpotDLAdapter.descargar_canciones_seleccionadas(
            [MagicMock()],
            "/tmp/out",
            callback_log=lambda m, t="error": logs_err.append(m)
        )
        assert res_err == []
        assert any("Error" in l for l in logs_err)
