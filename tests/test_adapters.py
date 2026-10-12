"""
Pruebas unitarias exhaustivas para infraestructura y dominio,
diseñadas para alcanzar más del 90% de cobertura de código.
"""

import pytest
from unittest.mock import patch, MagicMock
import numpy as np
from infrastructure.adapters import AudioAdapter
from domain.models import TrackDomain

# --- DOMINIO Y CASOS BORDE ---
def test_limpiar_texto_avanzado():
    """Valida la limpieza profunda de cadenas con múltiples patrones basura."""
    sucia = "12._spotdown.org_Test-Artist_-_Test-Title_(Remix)[Extended](Original Mix).mp3"
    limpia = TrackDomain.limpiar_texto(sucia)
    assert "spotdown" not in limpia
    assert ".mp3" not in limpia

def test_cerebro_ishkur_cobertura_total():
    """Verifica todas las ramas del clasificador Ishkur para maximizar cobertura."""
    # Hard Techno
    gen, sub = TrackDomain.cerebro_ishkur(145, 2026, ["hard techno"], 500, 0.09, 3000)
    assert gen == "Techno" and sub == "Hard Techno"

    # Melodic Techno
    gen, sub = TrackDomain.cerebro_ishkur(126, 2026, ["melodic techno"], 500, 0.05, 2000)
    assert gen == "Techno" and sub == "Melodic Techno"

    # Acid Techno
    gen, sub = TrackDomain.cerebro_ishkur(130, 2026, ["acid"], 500, 0.05, 2000)
    assert gen == "Techno" and sub == "Acid Techno"

    # Tech House (Independiente)
    gen, sub = TrackDomain.cerebro_ishkur(126, 2026, ["tech house"], 500, 0.05, 2000)
    assert gen == "Tech House" and sub == "Tech House"

    # Deep House
    gen, sub = TrackDomain.cerebro_ishkur(122, 2026, ["deep house"], 500, 0.05, 2000)
    assert gen == "House" and sub == "Deep House"

    # Afro House
    gen, sub = TrackDomain.cerebro_ishkur(120, 2026, ["afro house"], 500, 0.05, 2000)
    assert gen == "House" and sub == "Afro House"

    # Psy-Trance
    gen, sub = TrackDomain.cerebro_ishkur(142, 2026, ["psy-trance"], 500, 0.05, 2000)
    assert gen == "Trance" and sub == "Psy-Trance"

    # Vocales / Cantaditas
    gen, sub = TrackDomain.cerebro_ishkur(130, 2026, ["vocal"], 3000, 0.05, 2000)
    assert gen == "Vocales (Cantaditas)" and sub == "Vocal Trance"

    # Hardstyle
    gen, sub = TrackDomain.cerebro_ishkur(150, 2026, ["hardstyle"], 500, 0.05, 2000)
    assert gen == "Hard Dance & Hardcore" and sub == "Hardstyle"

    # Remember histórico
    gen, sub = TrackDomain.cerebro_ishkur(128, 1995, [], 500, 0.05, 2000)
    assert gen == "Remember & Classics" and sub == "Classic House"

    # Hardcore BPM alto
    gen, sub = TrackDomain.cerebro_ishkur(160, 2026, [], 500, 0.05, 2000)
    assert gen == "Hard Dance & Hardcore" and sub == "Hardcore"

    # Uplifting Trance
    gen, sub = TrackDomain.cerebro_ishkur(138, 2026, [], 500, 0.05, 3000)
    assert gen == "Trance" and sub == "Uplifting Trance"

    # House genérico
    gen, sub = TrackDomain.cerebro_ishkur(122, 2026, ["house"], 500, 0.05, 1500)
    assert gen == "House" and sub == "Deep House"

    # Techno BPM alto
    gen, sub = TrackDomain.cerebro_ishkur(134, 2026, [], 500, 0.05, 1500)
    assert gen == "Techno" and sub == "Minimal Techno"

    # Fallback
    gen, sub = TrackDomain.cerebro_ishkur(110, 2026, [], 500, 0.05, 1000)
    assert gen == "Tech House" and sub == "Tech House"


# --- INFRAESTRUCTURA Y ADAPTADORES ---
def test_obtener_metadatos_id3_fallback():
    """Valida los fallbacks de extracción de metadatos cuando no hay tags."""
    with patch('infrastructure.adapters.EasyID3') as mock_easyid3:
        mock_easyid3.side_effect = Exception("No tags")
        
        art, tit = AudioAdapter.obtener_metadatos_id3("/ruta/Art - Titulo.mp3", "Art - Titulo.mp3")
        assert art == "Art" and tit == "Titulo"
        
        art2, tit2 = AudioAdapter.obtener_metadatos_id3("/ruta/Future Trance 95.mp3", "Future Trance 95.mp3")
        assert art2 == "Various Artists" and "Future Trance 95" in tit2

        art3, tit3 = AudioAdapter.obtener_metadatos_id3("/ruta/unknown.mp3", "unknown.mp3")
        assert art3 == "VRC_MISSING" and tit3 == "VRC_MISSING"

@patch('infrastructure.adapters.requests.get')
def test_buscar_discogs_exito_y_fallo(mock_get):
    """Valida la respuesta correcta e incorrecta de Discogs."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        'results': [{
            'year': '2024',
            'style': ['Techno'],
            'title': 'ArtistDiscogs - TitleDiscogs'
        }]
    }
    mock_get.return_value = mock_resp

    año, estilos, art, tit = AudioAdapter.buscar_discogs("A", "T")
    assert año == 2024 and art == "ArtistDiscogs"

    mock_get.side_effect = Exception("Timeout")
    año2, estilos2, art2, tit2 = AudioAdapter.buscar_discogs("A", "T")
    assert año2 == 2026 and estilos2 == []

@patch('infrastructure.adapters.librosa.load')
@patch('infrastructure.adapters.librosa.effects.trim')
@patch('infrastructure.adapters.librosa.beat.beat_track')
@patch('infrastructure.adapters.librosa.feature.rms')
@patch('infrastructure.adapters.librosa.onset.onset_strength')
@patch('infrastructure.adapters.librosa.feature.mfcc')
@patch('infrastructure.adapters.librosa.feature.zero_crossing_rate')
@patch('infrastructure.adapters.librosa.feature.spectral_centroid')
def test_analizar_acustica_completa(mock_cent, mock_zcr, mock_mfcc, mock_onset, mock_rms, mock_beat, mock_trim, mock_load):
    """Valida el análisis acústico completo y el manejo de excepciones de Librosa."""
    mock_load.return_value = (np.zeros(100), 44100)
    mock_trim.return_value = (np.zeros(80), [10, 80])
    mock_beat.return_value = (128.0, np.array([10]))
    mock_rms.return_value = np.array([[0.2]])
    mock_onset.return_value = np.array([0.5])
    mock_mfcc.return_value = np.zeros((13, 10))
    mock_zcr.return_value = np.array([[0.05]])
    mock_cent.return_value = np.array([[2000.0]])

    bpm, energia, groove, presencia, zcr, cent = AudioAdapter.analizar_acustica("/ruta/test.mp3")
    assert bpm == 128.0

    mock_load.side_effect = Exception("Error audio")
    bpm_err, _, _, _, _, _ = AudioAdapter.analizar_acustica("/ruta/err.mp3")
    assert bpm_err == 128.0

@patch('infrastructure.adapters.Shazam')
def test_rescate_shazam_completo(mock_shazam_cls):
    """Valida el rescate con Shazam y su gestión de excepciones."""
    mock_inst = MagicMock()
    async def mock_ok(ruta):
        return {'track': {'subtitle': 'ShzArt', 'title': 'ShzTit'}}
    mock_inst.recognize_song = mock_ok
    mock_shazam_cls.return_value = mock_inst

    art, tit = AudioAdapter.rescate_shazam("/ruta/test.mp3")
    assert art == "ShzArt" and tit == "ShzTit"

    async def mock_err(ruta):
        raise Exception("Shazam fail")
    mock_inst.recognize_song = mock_err
    art_e, tit_e = AudioAdapter.rescate_shazam("/ruta/test.mp3")
    assert art_e == "VRC_MISSING"

@patch('infrastructure.adapters.MutagenFile')
@patch('infrastructure.adapters.EasyID3')
def test_actualizar_fichero_y_csv(mock_easyid3, mock_mutagen_file):
    """Valida la actualización de etiquetas físicas y la exportación del informe CSV."""
    mock_easyid3.side_effect = Exception("No tags")
    
    nombre = AudioAdapter.actualizar_fichero("/ruta/test.mp3", "ArtNew", "TitNew", 2025, 130, modo_seguro=True)
    assert "ArtNew - TitNew.mp3" in nombre

    nombre_desc = AudioAdapter.actualizar_fichero("/ruta/test.mp3", "VRC_MISSING", "VRC_MISSING", 2025, 126, modo_seguro=True)
    assert "VRC_Unidentified_Track_126BPM.mp3" in nombre_desc

    resultados = [{
        "artista": "Art", "titulo": "Tit", "duracion": "03:00", "bpm": 128, 
        "tonalidad": "8B", "mood": "Chill", "bailabilidad": "80%", "anio": 2025, 
        "genero": "Techno", "subgenero": "Hard Techno", "ruta_final": "/tmp/test.mp3"
    }]
    csv_out = AudioAdapter.exportar_informe_csv(resultados, "/tmp")
    assert csv_out is not None
