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

def test_clasificar_fase_sesion_dj():
    # 1. Warm-Up / Apertura
    warm = MoodIntelligenceService.clasificar_fase_sesion_dj(bpm=122.0, key="8A", energy=60, danceability=70)
    assert warm["fase_badge"] == "WARM-UP"
    assert "Inicio" in warm["fase"]

    # 2. Build-Up / Medio
    mid = MoodIntelligenceService.clasificar_fase_sesion_dj(bpm=128.0, key="8A", energy=75, danceability=80)
    assert mid["fase_badge"] == "BUILD-UP"
    assert "Medio" in mid["fase"]

    # 3. Peak Time / Caña
    cana = MoodIntelligenceService.clasificar_fase_sesion_dj(bpm=135.0, key="4A", energy=90, danceability=90)
    assert cana["fase_badge"] == "CAÑA"
    assert "Caña" in cana["fase"] or "Peak Time" in cana["fase"]

    # 4. Cierre / Anthem
    cierre = MoodIntelligenceService.clasificar_fase_sesion_dj(bpm=140.0, key="8B", energy=88, danceability=85)
    assert cierre["fase_badge"] == "CIERRE"

    # 5. Calma / Sunset / After
    calma = MoodIntelligenceService.clasificar_fase_sesion_dj(bpm=112.0, key="1A", energy=40, danceability=50)
    assert calma["fase_badge"] == "CALMA"

def test_detectar_duplicados_y_calidad():
    from services.audit_service import AuditService
    audit = AuditService()
    tracks = [
        {
            "id": 1,
            "title": "Moon Rocks (Extended Mix)",
            "artist": "Enrico Sangiuliano",
            "format": "FLAC",
            "sample_rate_khz": 44.1,
            "bitrate_kbps": 1040,
            "cutoff_khz": 22.0,
            "bpm": "130.00",
            "key": "8A",
            "es_fake": False
        },
        {
            "id": 2,
            "title": "Moon Rocks",
            "artist": "Enrico Sangiuliano",
            "format": "MP3",
            "sample_rate_khz": 44.1,
            "bitrate_kbps": 320,
            "cutoff_khz": 20.2,
            "bpm": "130.00",
            "key": "8A",
            "es_fake": False
        }
    ]
    res = audit.detectar_duplicados_biblioteca(tracks)
    assert res["total_grupos"] == 1
    assert res["total_duplicados"] == 1
    grupo = res["grupos"][0]
    assert grupo["winner"]["format"] == "FLAC"
    assert grupo["winner"]["is_winner"] is True
    assert grupo["tracks"][1]["format"] == "MP3"
    assert grupo["tracks"][1]["is_winner"] is False
    assert grupo["tracks"][1]["delete_selected"] is True
