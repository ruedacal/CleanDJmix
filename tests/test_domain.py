"""
Pruebas unitarias para el módulo de dominio (domain/models.py).
Valida la limpieza de texto y la taxonomía del Cerebro Ishkur.
"""

import pytest
from domain.models import TrackDomain

def test_limpiar_texto_basico():
    """Valida la limpieza básica de textos con basura y extensiones."""
    sucia = "01 - Artist Name - Track Title (Original Mix).mp3"
    limpia = TrackDomain.limpiar_texto(sucia)
    assert limpia == "Artist Name - Track Title"

def test_limpiar_texto_vacio():
    """Valida el manejo de cadenas vacías o nulas."""
    assert TrackDomain.limpiar_texto("") == ""
    assert TrackDomain.limpiar_texto(None) == ""

def test_cerebro_ishkur_tech_house():
    """Verifica que Tech House se clasifica en su categoría independiente."""
    genero, subgenero = TrackDomain.cerebro_ishkur(126, 2026, ["tech house"], 500, 0.05, 2000)
    assert genero == "Tech House"
    assert subgenero == "Tech House"

def test_cerebro_ishkur_remember():
    """Verifica la clasificación correcta para la categoría Remember & Classics."""
    genero, subgenero = TrackDomain.cerebro_ishkur(128, 1995, ["house"], 500, 0.05, 2000)
    assert genero == "Remember & Classics"
    assert subgenero == "Classic House"
