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
    # BPM y Tonalidad deben estar eliminados del comentario
    assert "128.0 BPM" not in comment_es
    assert "8A" not in comment_es
    assert "Estructura:" in comment_es
    assert "Ubicación DJ:" in comment_es

    comment_en = MoodIntelligenceService.generar_comentario_tactico(
        bpm=128.0, key="8A", mood="Peak Time", subtag="Peak Time / Driving", energy=88, lang="en"
    )
    assert "128.0 BPM" not in comment_en
    assert "Structure:" in comment_en
    assert "Set Role:" in comment_en

def test_generar_album_tactico_serato():
    # Ejemplo solicitado: [BUILD-UP E81%] Dark / Industrial. Mix Armónico: 7A (Neutral) • 8A/6A (Cambio Energía)
    album_str = MoodIntelligenceService.generar_album_tactico_serato(
        bpm=128.0, key="7A", mood="Dark", subtag="Dark / Industrial", energy=81, lang="es"
    )
    assert "[BUILD-UP E81%]" in album_str
    assert "Dark / Industrial" in album_str
    assert "Mix Armónico: 7A (Neutral) • 8A/6A (Cambio Energía)" in album_str

    album_str_en = MoodIntelligenceService.generar_album_tactico_serato(
        bpm=128.0, key="7A", mood="Dark", subtag="Dark / Industrial", energy=81, lang="en"
    )
    assert "[BUILD-UP E81%]" in album_str_en
    assert "Harmonic Mix: 7A (Neutral) • 8A/6A (Energy Shift)" in album_str_en

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


def test_proteger_versiones_hermanas_dj():
    from services.audit_service import AuditService
    audit = AuditService()
    # Crusy - Karma vs Karma (Extended Mix): ambas en FLAC
    tracks = [
        {
            "id": 1,
            "title": "Karma (Extended Mix)",
            "artist": "Crusy",
            "format": "FLAC",
            "sample_rate_khz": 44.1,
            "bitrate_kbps": 1040,
            "cutoff_khz": 22.0,
            "es_fake": False
        },
        {
            "id": 2,
            "title": "Karma",
            "artist": "Crusy",
            "format": "FLAC",
            "sample_rate_khz": 44.1,
            "bitrate_kbps": 1030,
            "cutoff_khz": 22.0,
            "es_fake": False
        }
    ]
    # Con protección de versiones hermanas activa: ambas deben conservarse, 0 eliminadas
    res = audit.detectar_duplicados_biblioteca(tracks, proteger_versiones_hermanas=True)
    assert res["total_grupos"] == 1
    assert res["total_duplicados"] == 0
    grupo = res["grupos"][0]
    assert grupo["tiene_versiones_hermanas"] is True
    assert grupo["duplicados_a_eliminar"] == 0
    for t in grupo["tracks"]:
        assert t["is_winner"] is True
        assert t["delete_selected"] is False


def test_nunca_agrupar_canciones_diferentes():
    from services.audit_service import AuditService
    audit = AuditService()
    # Chlär - Silver Skin vs Chlär - Fixated
    # Aunque compartieran huella o bitrate, NUNCA deben agruparse juntas
    tracks = [
        {
            "id": 10,
            "title": "Silver Skin",
            "artist": "Chlär",
            "format": "FLAC",
            "sample_rate_khz": 48.0,
            "bitrate_kbps": 1798,
            "cutoff_khz": 20.1,
            "acoustic_fp": "b9a622009fc2bcca605f2a49bd635fe2_0bc70ad68cdb316b",
            "es_fake": False
        },
        {
            "id": 11,
            "title": "Fixated",
            "artist": "Chlär",
            "format": "FLAC",
            "sample_rate_khz": 48.0,
            "bitrate_kbps": 1798,
            "cutoff_khz": 20.1,
            "acoustic_fp": "b9a622009fc2bcca605f2a49bd635fe2_0bc70ad68cdb316b",
            "es_fake": False
        },
        {
            "id": 12,
            "title": "Fixated - Chlär Remix",
            "artist": "Chlär",
            "format": "FLAC",
            "sample_rate_khz": 48.0,
            "bitrate_kbps": 1798,
            "cutoff_khz": 20.1,
            "acoustic_fp": "b9a622009fc2bcca605f2a49bd635fe2_0bc70ad68cdb316b",
            "es_fake": False
        }
    ]
    res = audit.detectar_duplicados_biblioteca(tracks, proteger_versiones_hermanas=True)
    # Silver Skin queda en su propio grupo de 1 pista (no forma grupo de duplicados)
    # Fixated y Fixated - Chlär Remix forman grupo de versiones hermanas
    assert res["total_grupos"] == 1
    grupo = res["grupos"][0]
    nombres_en_grupo = [t["title"] for t in grupo["tracks"]]
    assert "Silver Skin" not in nombres_en_grupo
    assert "Fixated" in nombres_en_grupo
    assert "Fixated - Chlär Remix" in nombres_en_grupo
    # Al ser versiones hermanas protegidas (Original vs Remix), ninguna se elimina
    assert res["total_duplicados"] == 0

