import pytest
from services.mood_intelligence_service import MoodIntelligenceService

def test_clasificar_mood_camelot_y_bpm():
    # Peak time
    res = MoodIntelligenceService.clasificar_mood(bpm=128.0, key="8A", energy=85)
    assert res["mood"] in ("Peak Time", "Dark", "Euphoric", "Hypnotic", "Raw", "Melancholic")
    assert "valence" in res
    assert "arousal" in res

    # Raw hardgroove
    res_raw = MoodIntelligenceService.clasificar_mood(bpm=140.0, key="8A", energy=90)
    assert res_raw["mood"] == "Raw"

    # Euphoric major key
    res_euphoric = MoodIntelligenceService.clasificar_mood(bpm=126.0, key="8B", energy=78)
    assert res_euphoric["mood"] == "Euphoric"

def test_generar_comentario_tactico_es_y_en():
    comment_es = MoodIntelligenceService.generar_comentario_tactico(
        bpm=128.0, key="8A", mood="Peak Time", subtag="Peak Time / Driving", energy=88, lang="es"
    )
    assert "128.0 BPM" in comment_es
    assert "8A" in comment_es
    assert "Mix Armónico" in comment_es
    assert "8B" in comment_es  # Relative Camelot

    comment_en = MoodIntelligenceService.generar_comentario_tactico(
        bpm=128.0, key="8A", mood="Peak Time", subtag="Peak Time / Driving", energy=88, lang="en"
    )
    assert "128.0 BPM" in comment_en
    assert "Harmonic Mix" in comment_en
    assert "Structure" in comment_en
