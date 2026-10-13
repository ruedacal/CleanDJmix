import os
import pytest
from unittest.mock import MagicMock, patch
from application.taxonomy_service import TaxonomyService

# -------------------------------------------------------------
# PRUEBAS DE RESOLUCIÓN DE RUTAS
# -------------------------------------------------------------

def test_resolver_ruta_destino_por_defecto(tmp_path):
    service = TaxonomyService()
    ruta_base = str(tmp_path / "MiMusica")
    destino = service.resolver_ruta_destino(
        ruta_base=ruta_base,
        genero="House",
        subgenero="Tech House",
        nombre_archivo="Fisher - Losing It.mp3"
    )
    esperado = os.path.join(ruta_base, "Tech House", "Fisher - Losing It.mp3")
    assert destino == esperado

def test_resolver_ruta_destino_personalizada(tmp_path):
    service = TaxonomyService()
    ruta_base = str(tmp_path / "MiMusica")
    custom_dir = str(tmp_path / "Crates_Serato")
    os.makedirs(custom_dir, exist_ok=True)

    config = {
        "Techno": {
            "Peak Time / Driving": {
                "carpeta": "132_Peak_Time",
                "ruta": custom_dir
            }
        }
    }

    destino = service.resolver_ruta_destino(
        ruta_base=ruta_base,
        genero="Techno",
        subgenero="Peak Time / Driving",
        nombre_archivo="Enrico Sangiuliano - Moon Rocks.mp3",
        config_destinos=config
    )
    esperado = os.path.join(custom_dir, "132_Peak_Time", "Enrico Sangiuliano - Moon Rocks.mp3")
    assert destino == esperado

def test_resolver_ruta_subgenero_no_en_config(tmp_path):
    service = TaxonomyService()
    ruta_base = str(tmp_path / "MiMusica")
    config = {"Techno": {"Peak Time": {"carpeta": "Peak", "ruta": ""}}}

    destino = service.resolver_ruta_destino(
        ruta_base=ruta_base,
        genero="Techno",
        subgenero="Raw / Deep",
        nombre_archivo="Track.mp3",
        config_destinos=config
    )
    esperado = os.path.join(ruta_base, "Raw / Deep", "Track.mp3")
    assert destino == esperado

def test_resolver_ruta_directorio_custom_inexistente_o_vacio(tmp_path):
    service = TaxonomyService()
    ruta_base = str(tmp_path / "MiMusica")
    config = {
        "Trance": {
            "Uplifting": {
                "carpeta": "",  # Vacia -> fallback al subgenero
                "ruta": "/ruta/totalmente/inexistente/en/disco"
            }
        }
    }

    destino = service.resolver_ruta_destino(
        ruta_base=ruta_base,
        genero="Trance",
        subgenero="Uplifting",
        nombre_archivo="Track.mp3",
        config_destinos=config
    )
    esperado = os.path.join(ruta_base, "Uplifting", "Track.mp3")
    assert destino == esperado

# -------------------------------------------------------------
# PRUEBAS DE ORGANIZACIÓN Y TRASLADO FÍSICO
# -------------------------------------------------------------

def test_organizar_pista_modo_seguro(tmp_path):
    mock_adapter = MagicMock()
    mock_adapter.actualizar_fichero.return_value = str(tmp_path / "Carl Cox - Finder.mp3")
    service = TaxonomyService(audio_adapter=mock_adapter)
    
    p = tmp_path / "test.mp3"
    p.touch()

    res = service.organizar_pista(
        ruta_origen=str(p),
        artista="Carl Cox",
        titulo="Finder",
        bpm=126,
        año=2015,
        genero="House",
        subgenero="Tech House",
        ruta_base=str(tmp_path),
        modo_seguro=True
    )

    assert res["estado"] == "Simulado (Modo Seguro)"
    assert os.path.exists(str(p))
    mock_adapter.actualizar_fichero.assert_called_once()

def test_organizar_pista_mover_real(tmp_path):
    service = TaxonomyService()
    origen_dir = tmp_path / "descargas"
    origen_dir.mkdir()
    archivo = origen_dir / "track.mp3"
    archivo.write_text("dummy mp3 content")

    res = service.organizar_pista(
        ruta_origen=str(archivo),
        artista="Adam Beyer",
        titulo="Teach Me",
        bpm=130,
        año=2014,
        genero="Techno",
        subgenero="Driving",
        ruta_base=str(tmp_path / "libreria"),
        modo_seguro=False,
        mover_archivo=True
    )

    assert res["estado"] == "OK"
    assert not os.path.exists(str(archivo))
    assert os.path.exists(res["ruta_destino"])

def test_organizar_pista_copiar_real(tmp_path):
    service = TaxonomyService()
    origen_dir = tmp_path / "descargas"
    origen_dir.mkdir()
    archivo = origen_dir / "track_copy.mp3"
    archivo.write_text("mp3 content")

    res = service.organizar_pista(
        ruta_origen=str(archivo),
        artista="Amelie Lens",
        titulo="Higher",
        bpm=135,
        año=2020,
        genero="Techno",
        subgenero="Acid",
        ruta_base=str(tmp_path / "libreria"),
        modo_seguro=False,
        mover_archivo=False  # Copiar sin borrar origen
    )

    assert res["estado"] == "OK"
    assert os.path.exists(str(archivo))  # El original sigue existiendo
    assert os.path.exists(res["ruta_destino"])

def test_organizar_pista_mismo_origen_y_destino(tmp_path):
    service = TaxonomyService()
    destino_dir = tmp_path / "Tech House"
    destino_dir.mkdir()
    archivo = destino_dir / "Paco Osuna - Groove.mp3"
    archivo.write_text("mp3 content")

    res = service.organizar_pista(
        ruta_origen=str(archivo),
        artista="Paco Osuna",
        titulo="Groove",
        bpm=125,
        año=2021,
        genero="House",
        subgenero="Tech House",
        ruta_base=str(tmp_path),
        modo_seguro=False,
        mover_archivo=True
    )

    assert res["estado"] == "OK"
    assert os.path.exists(str(archivo))

def test_organizar_pista_retorno_inyeccion_sin_extension(tmp_path):
    mock_adapter = MagicMock()
    mock_adapter.actualizar_fichero.return_value = "NombreInvalidoSinExtension"
    service = TaxonomyService(audio_adapter=mock_adapter)

    archivo = tmp_path / "origen.mp3"
    archivo.write_text("audio")

    res = service.organizar_pista(
        ruta_origen=str(archivo),
        artista="Charlotte de Witte",
        titulo="Apollo",
        bpm=134,
        año=2022,
        genero="Techno",
        subgenero="Peak Time",
        ruta_base=str(tmp_path),
        modo_seguro=False
    )

    assert res["estado"] == "OK"
    assert res["ruta_destino"].endswith("Charlotte de Witte - Apollo.mp3")

def test_organizar_pista_error_disco(tmp_path):
    service = TaxonomyService()
    archivo = tmp_path / "err.mp3"
    archivo.write_text("data")

    with patch("shutil.move", side_effect=PermissionError("Acceso denegado")):
        res = service.organizar_pista(
            ruta_origen=str(archivo),
            artista="Boris Brejcha",
            titulo="Gravity",
            bpm=125,
            año=2019,
            genero="Minimal",
            subgenero="High-Tech",
            ruta_base=str(tmp_path),
            modo_seguro=False,
            mover_archivo=True
        )

    assert "Error:" in res["estado"]
    assert "Acceso denegado" in res["estado"]
