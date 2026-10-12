"""
Pruebas unitarias para validar las reglas de negocio del Dominio (TrackDomain)
incluyendo la nueva taxonomía avanzada de géneros y subgéneros electrónicos.
"""

import pytest
from domain.models import TrackDomain

def test_limpiar_texto_basico():
    """Valida la eliminación de extensiones, webs y caracteres extraños."""
    sucia = "01._spotdown.org_Avicii_-_Levels_(Radio_Edit).mp3"
    limpia = TrackDomain.limpiar_texto(sucia)
    assert "spotdown" not in limpia
    assert ".mp3" not in limpia

def test_cerebro_ishkur_hard_techno():
    """Verifica la clasificación exacta de subgéneros como Hard Techno."""
    genero, subgenero = TrackDomain.cerebro_ishkur(
        bpm=142.0, 
        año=2025, 
        estilos=["hard techno"], 
        presencia_vocal=500.0, 
        zcr=0.09, 
        centroide=3000.0
    )
    assert genero == "Techno"
    assert subgenero == "Hard Techno"

def test_cerebro_ishkur_remember():
    """Verifica que los temas entre 1980 y 2011 se clasifiquen como Remember."""
    genero, subgenero = TrackDomain.cerebro_ishkur(
        bpm=128.0, 
        año=2005, 
        estilos=["trance"], 
        presencia_vocal=1000.0, 
        zcr=0.05, 
        centroide=2000.0
    )
    assert genero == "Remember"
    assert subgenero == "Retro Classic"

def test_cerebro_ishkur_tech_house():
    """Verifica la clasificación por defecto para Tech House."""
    genero, subgenero = TrackDomain.cerebro_ishkur(
        bpm=126.0, 
        año=2026, 
        estilos=["tech house"], 
        presencia_vocal=1200.0, 
        zcr=0.04, 
        centroide=1500.0
    )
    assert genero == "House"
    assert subgenero == "Tech House"
