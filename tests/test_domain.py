"""
Pruebas unitarias para validar las reglas de negocio del Dominio (TrackDomain).
Garantiza que la limpieza de textos y el cerebro clasificador funcionen correctamente bajo cualquier escenario.
"""

import pytest
from domain.models import TrackDomain

def test_limpiar_texto_basico():
    """Valida la eliminación de extensiones, webs y caracteres extraños en nombres de pistas."""
    sucia = "01._spotdown.org_Avicii_-_Levels_(Radio_Edit).mp3"
    limpia = TrackDomain.limpiar_texto(sucia)
    # Se espera que limpie numeraciones, URLs y paréntesis
    assert "spotdown" not in limpia
    assert ".mp3" not in limpia

def test_cerebro_ishkur_remember():
    """Verifica que los temas entre 1980 y 2011 se clasifiquen automáticamente como Remember."""
    genero = TrackDomain.cerebro_ishkur(
        bpm=128.0, 
        año=2005, 
        estilos=["trance"], 
        presencia_vocal=1000.0, 
        zcr=0.05, 
        centroide=2000.0
    )
    assert genero == "Remember"

def test_cerebro_ishkur_techno():
    """Verifica la correcta clasificación de pistas con ritmos rápidos de Techno."""
    genero = TrackDomain.cerebro_ishkur(
        bpm=135.0, 
        año=2024, 
        estilos=["hard techno"], 
        presencia_vocal=500.0, 
        zcr=0.09, 
        centroide=3000.0
    )
    assert genero == "Techno"

def test_cerebro_ishkur_tech_house():
    """Verifica la clasificación por defecto para ritmos moderados de Tech House."""
    genero = TrackDomain.cerebro_ishkur(
        bpm=126.0, 
        año=2025, 
        estilos=["tech house"], 
        presencia_vocal=1200.0, 
        zcr=0.04, 
        centroide=1500.0
    )
    assert genero == "Tech House"
