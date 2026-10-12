"""
Pruebas unitarias completas para la capa de Infraestructura y Dominio,
diseñadas para superar el 80% de cobertura de código.
"""

import pytest
from unittest.mock import patch, MagicMock
import numpy as np
from infrastructure.adapters import AudioAdapter
from domain.models import TrackDomain

# --- TESTS DE DOMINIO (domain/models.py) ---
def test_limpiar_texto_completo():
    """Valida la limpieza profunda de cadenas de texto y URLs."""
    sucio = "https://www.example.com 02._spotdown.org_Test_Artist_-_Test_Title_(Remix)[Extended].mp3"
    limpio = TrackDomain.limpiar_texto(sucio)
    assert "spotdown" not in limpio
    assert "https" not in limpio
    assert ".mp3" not in limpio

def test_cerebro_ishkur_casos_borde():
    """Prueba diferentes combinaciones y umbrales del cerebro clasificador de Ishkur."""
    # Caso Remember por año
    assert TrackDomain.cerebro_ishkur(128, 1995, [], 100, 0.05, 1000) == "Remember"
    
    # Caso Cantaditas por estilo explícito
    assert TrackDomain.cerebro_ishkur(135, 2024, ["eurodance"], 100, 0.05, 1000) == "Cantaditas"
    
    # Caso Trance por estilo explícito
    assert TrackDomain.cerebro_ishkur(140, 2024, ["trance"], 100, 0.05, 1000) == "Trance"
    
    # Caso House clásico
    assert TrackDomain.cerebro_ishkur(120, 2024, ["house"], 1000, 0.02, 1000) == "House"
    
    # Caso Fallback por BPM alto y ZCR
    assert TrackDomain.cerebro_ishkur(140, 2024, [], 500, 0.09, 1500) == "Techno"

# --- TESTS DE INFRAESTRUCTURA (infrastructure/adapters.py) ---
def test_obtener_metadatos_id3_recopilatorio():
    """Valida la detección de álbumes recopilatorios."""
    with patch('infrastructure.adapters.EasyID3') as mock_easyid3:
        mock_easyid3.side_effect = Exception("No tags")
        artista, titulo = AudioAdapter.obtener_metadatos_id3("/ruta/Future Trance 92.mp3", "Future Trance 92.mp3")
        assert artista == "Various Artists"
        assert "Future Trance 92" in titulo

def test_obtener_metadatos_id3_con_guion():
    """Valida la extracción de metadatos mediante guion en el nombre del fichero."""
    with patch('infrastructure.adapters.EasyID3') as mock_easyid3:
        mock_easyid3.side_effect = Exception("No tags")
        artista, titulo = AudioAdapter.obtener_metadatos_id3("/ruta/Energy - Track01.mp3", "Energy - Track01.mp3")
        assert artista == "Energy"
        assert titulo == "Track01"

def test_obtener_metadatos_id3_exitoso():
    """Valida la lectura correcta cuando los tags ID3 existen."""
    with patch('infrastructure.adapters.EasyID3') as mock_easyid3:
        mock_tags = MagicMock()
        mock_tags.get.side_effect = lambda key, default: ['ArtistaTest'] if key == 'artist' else ['TituloTest']
        mock_easyid3.return_value = mock_tags
        
        artista, titulo = AudioAdapter.obtener_metadatos_id3("/ruta/test.mp3", "test.mp3")
        assert artista == "ArtistaTest"
        assert titulo == "TituloTest"

@patch('infrastructure.adapters.requests.get')
def test_buscar_discogs_exito(mock_get):
    """Simula una respuesta exitosa de la API de Discogs."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        'results': [{
            'year': '2023',
            'style': ['Techno', 'Hard Techno'],
            'title': 'TestArtist - TestTitle'
        }]
    }
    mock_get.return_value = mock_response

    año, estilos, artista, titulo = AudioAdapter.buscar_discogs("AntiguoArt", "AntiguoTit")
    assert año == 2023
    assert "techno" in estilos
    assert artista == "TestArtist"
    assert titulo == "TestTitle"

@patch('infrastructure.adapters.requests.get')
def test_buscar_discogs_fallo(mock_get):
    """Simula un fallo o error en la API de Discogs."""
    mock_get.side_effect = Exception("Error de red")
    año, estilos, artista, titulo = AudioAdapter.buscar_discogs("Art", "Tit")
    assert año == 2026
    assert estilos == []

@patch('infrastructure.adapters.librosa.load')
@patch('infrastructure.adapters.librosa.effects.trim')
@patch('infrastructure.adapters.librosa.beat.beat_track')
@patch('infrastructure.adapters.librosa.feature.rms')
@patch('infrastructure.adapters.librosa.onset.onset_strength')
@patch('infrastructure.adapters.librosa.feature.mfcc')
@patch('infrastructure.adapters.librosa.feature.zero_crossing_rate')
@patch('infrastructure.adapters.librosa.feature.spectral_centroid')
def test_analizar_acustica(mock_cent, mock_zcr, mock_mfcc, mock_onset, mock_rms, mock_beat, mock_trim, mock_load):
    """Simula el análisis acústico completo de Librosa incluyendo el recorte de silencio."""
    mock_load.return_value = (np.zeros(100), 44100)
    mock_trim.return_value = (np.zeros(80), [10, 80]) # Silencio inicial simulado > 40ms
    mock_beat.return_value = (130.0, np.array([10, 20]))
    mock_rms.return_value = np.array([[0.1]])
    mock_onset.return_value = np.array([0.5])
    mock_mfcc.return_value = np.zeros((13, 10))
    mock_zcr.return_value = np.array([[0.05]])
    mock_cent.return_value = np.array([[2000.0]])

    bpm, energia, groove, presencia, zcr, cent = AudioAdapter.analizar_acustica("/ruta/dummy.mp3")
    assert bpm == 130.0
    assert isinstance(energia, int)
    assert isinstance(groove, int)

@patch('infrastructure.adapters.Shazam')
def test_rescate_shazam(mock_shazam_cls):
    """Simula la respuesta asíncrona de Shazam para el rescate acústico."""
    mock_instance = MagicMock()
    # Mock de corrutina para recognize_song
    async def mock_recognize(ruta):
        return {
            'track': {
                'subtitle': 'ShazamArtist',
                'title': 'ShazamTitle'
            }
        }
    mock_instance.recognize_song = mock_recognize
    mock_shazam_cls.return_value = mock_instance

    art, tit = AudioAdapter.rescate_shazam("/ruta/falsa.mp3")
    assert art == "ShazamArtist"
    assert tit == "ShazamTitle"

def test_actualizar_fichero_seguro():
    """Valida el modo seguro de actualización de nombres."""
    nombre = AudioAdapter.actualizar_fichero("/ruta/falsa.mp3", "Art", "Tit", 2025, 128, modo_seguro=True)
    assert nombre == "Art - Tit.mp3"

def test_actualizar_fichero_desconocido_seguro():
    """Valida el nombramiento para pistas no identificadas en modo seguro."""
    nombre = AudioAdapter.actualizar_fichero("/ruta/falsa.mp3", "VRC_MISSING", "VRC_MISSING", 2025, 125, modo_seguro=True)
    assert "VRC_Unidentified_Track_125BPM.mp3" in nombre

@patch('infrastructure.adapters.Shazam')
def test_rescate_shazam_fallo(mock_shazam_cls):
    """Valida que si Shazam falla o no reconoce la pista, devuelva VRC_MISSING."""
    mock_instance = MagicMock()
    async def mock_recognize_error(ruta):
        raise Exception("Error de conexión Shazam")
    mock_instance.recognize_song = mock_recognize_error
    mock_shazam_cls.return_value = mock_instance

    art, tit = AudioAdapter.rescate_shazam("/ruta/falsa.mp3")
    assert art == "VRC_MISSING"
    assert tit == "VRC_MISSING"

@patch('infrastructure.adapters.EasyID3')
@patch('infrastructure.adapters.mutagen.File')
def test_actualizar_fichero_crear_tags(mock_mutagen_file, mock_easyid3):
    """Valida la creación de etiquetas ID3 cuando el archivo no tiene cabecera previa."""
    mock_easyid3.side_effect = Exception("No header")
    mock_file_instance = MagicMock()
    mock_mutagen_file.return_value = mock_file_instance
    
    nombre = AudioAdapter.actualizar_fichero(
        ruta_completa="/ruta/falsa.mp3",
        artista="NuevoArtista",
        titulo="NuevoTitulo",
        año=2026,
        bpm=124,
        modo_seguro=False
    )
    assert nombre == "NuevoArtista - NuevoTitulo.mp3"
