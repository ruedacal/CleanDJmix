import os
import xml.etree.ElementTree as ET
import pytest
from services.export_service import ExportService

def test_generar_serato_crate_binario():
    paths = [
        "/Users/admin/Music/Techno/Adam Beyer - Your Mind.mp3",
        "/Users/admin/Music/House/Fisher - Losing It.flac"
    ]
    raw_bin = ExportService.generar_serato_crate_binario(paths)
    assert raw_bin.startswith(b"vrsn")
    assert b"otrk" in raw_bin
    assert b"ptrk" in raw_bin
    # Verificar que las rutas están codificadas en UTF-16BE
    assert "Your Mind".encode("utf-16-be") in raw_bin
    assert "Losing It".encode("utf-16-be") in raw_bin

def test_exportar_serato_crates_exito(tmp_path):
    svc = ExportService()
    crate_dir = str(tmp_path / "Subcrates")

    tracks = [
        {
            "path": "/Music/track1.mp3",
            "genre": "Techno",
            "subgenre": "Peak Time / Driving",
            "title": "Track 1"
        },
        {
            "path": "/Music/track2.mp3",
            "genre": "Techno",
            "subgenre": "Melodic Techno",
            "title": "Track 2"
        },
        {
            "path": "/Music/track3.mp3",
            "genre": "House",
            "subgenre": "Tech House",
            "title": "Track 3"
        }
    ]

    res = svc.exportar_serato_crates(tracks, destino_serato_dir=crate_dir)
    assert res["status"] == "ok"
    assert res["total_pistas"] == 3
    assert res["total_crates"] >= 4  # Master + 2 Generos + 3 Subgeneros

    assert os.path.exists(os.path.join(crate_dir, "CleanDJmix_Master.crate"))
    assert os.path.exists(os.path.join(crate_dir, "Techno.crate"))
    assert os.path.exists(os.path.join(crate_dir, "House.crate"))
    assert os.path.exists(os.path.join(crate_dir, "Techno%%Peak Time - Driving.crate"))
    assert os.path.exists(os.path.join(crate_dir, "House%%Tech House.crate"))

def test_exportar_serato_crates_vacio():
    svc = ExportService()
    res = svc.exportar_serato_crates([])
    assert res["status"] == "error"

def test_exportar_rekordbox_xml_exito(tmp_path):
    svc = ExportService()
    output_dir = str(tmp_path / "rekordbox_out")

    tracks = [
        {
            "path": "/Music/Enrico - Moon Rocks.mp3",
            "title": "Moon Rocks",
            "artist": "Enrico Sangiuliano",
            "album": "Moon Rocks EP",
            "bpm": "130.00",
            "key": "11A",
            "genre": "Techno",
            "subgenre": "Peak Time / Driving",
            "duration": "07:15",
            "comment": "Intro limpia 32b • Drop potente",
            "cues": [
                {"name": "Intro", "pct": 0.0, "color": "#06b6d4"},
                {"name": "Drop 1", "pct": 0.25, "color": "#f97316"}
            ]
        },
        {
            "path": "/Music/Camelphat - Cola.flac",
            "title": "Cola",
            "artist": "CamelPhat",
            "album": "Defected",
            "bpm": "122.00",
            "key": "8A",
            "genre": "House",
            "subgenre": "Tech House",
            "duration": "03:45",
            "comment": "Vocal limpia",
            "cues": []
        }
    ]

    res = svc.exportar_rekordbox_xml(tracks, destino_dir=output_dir, nombre_archivo="test_rekordbox.xml")
    assert res["status"] == "ok"
    assert res["total_tracks"] == 2
    assert os.path.exists(res["path"])

    # Parsear y verificar estructura XML estándar Pioneer DJ
    tree = ET.parse(res["path"])
    root = tree.getroot()
    assert root.tag == "DJ_PLAYLISTS"
    assert root.attrib.get("Version") == "1.0.0"

    product = root.find("PRODUCT")
    assert product is not None
    assert product.attrib.get("Company") == "Pioneer DJ"

    collection = root.find("COLLECTION")
    assert collection is not None
    assert collection.attrib.get("Entries") == "2"

    t_elements = collection.findall("TRACK")
    assert len(t_elements) == 2

    # Verificar metadatos y cues del track 1
    t1 = t_elements[0]
    assert t1.attrib.get("Name") == "Moon Rocks"
    assert t1.attrib.get("Artist") == "Enrico Sangiuliano"
    assert t1.attrib.get("AverageBpm") == "130.00"
    assert t1.attrib.get("Tonality") == "11A"
    assert t1.attrib.get("Kind") == "MP3 File"
    assert t1.attrib.get("Location").startswith("file://localhost")

    cues_el = t1.findall("POSITION_MARK")
    assert len(cues_el) == 2
    assert cues_el[0].attrib.get("Name") == "Intro"
    assert cues_el[1].attrib.get("Name") == "Drop 1"

    # Verificar árbol de Playlists
    playlists = root.find("PLAYLISTS")
    assert playlists is not None
    root_node = playlists.find("NODE")
    assert root_node.attrib.get("Name") == "ROOT"
    cdj_node = root_node.find("NODE")
    assert cdj_node.attrib.get("Name") == "CleanDJmix"

    genre_nodes = cdj_node.findall("NODE")
    genre_names = [n.attrib.get("Name") for n in genre_nodes]
    assert "Techno" in genre_names
    assert "House" in genre_names

def test_exportar_rekordbox_xml_vacio():
    svc = ExportService()
    res = svc.exportar_rekordbox_xml([])
    assert res["status"] == "error"

def test_exportar_tracks_xls(tmp_path):
    svc = ExportService()
    res = svc.exportar_tracks_xls([{"title": "Test Track", "bpm": 128}], destino_dir=str(tmp_path))
    assert res["status"] == "ok"
    assert os.path.exists(res["path"])
