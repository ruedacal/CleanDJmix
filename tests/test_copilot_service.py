"""
Pruebas Unitarias para BeatWave Live Copilot v2.0 (Clean-Room & Zero-Cost).
Valida la orquestación de red, DSP Clean-Room (Anti-Muddy, Camelot),
y decodificación de paquetes Pioneer Pro DJ Link y OS2L.
"""

import pytest
from services.copilot import (
    CopilotEngine,
    copilot_engine,
    DSPCleanRoomEngine,
    DeckState,
    ProDJLinkReceiver,
    OS2LReceiver,
    LibraryReader
)


def test_copilot_engine_initialization():
    engine = CopilotEngine()
    state = engine.get_live_state()
    assert state is not None
    assert "decks" in state
    assert 1 in state["decks"]
    assert 2 in state["decks"]
    assert state["master_deck"] == 1
    assert state["global_bpm"] > 0


def test_copilot_dsp_harmonic_compatibility():
    # Mismo tono (perfect match)
    res_same = DSPCleanRoomEngine.evaluar_compatibilidad_armonica("8A", "8A")
    assert res_same["score"] == 100
    assert res_same["is_clash"] is False

    # Vecino (+1 Camelot: 8A -> 9A)
    res_up = DSPCleanRoomEngine.evaluar_compatibilidad_armonica("8A", "9A")
    assert res_up["score"] == 92
    assert res_up["is_clash"] is False

    # Relativo menor a mayor (8A <-> 8B)
    res_rel = DSPCleanRoomEngine.evaluar_compatibilidad_armonica("8A", "8B")
    assert res_rel["score"] == 88
    assert res_rel["is_clash"] is False

    # Energy Boost (+2: 8A -> 10A)
    res_boost = DSPCleanRoomEngine.evaluar_compatibilidad_armonica("8A", "10A")
    assert res_boost["score"] == 78
    assert res_boost["is_clash"] is False

    # Choque armónico disonante (8A vs 2A)
    res_clash = DSPCleanRoomEngine.evaluar_compatibilidad_armonica("8A", "2A")
    assert res_clash["score"] == 35
    assert res_clash["is_clash"] is True


def test_copilot_dsp_anti_muddy_guard():
    # 1. Ambos decks en play con graves saturados -> Debe disparar alerta crítica
    d1 = DeckState(deck_id=1, is_playing=True, bpm=128.0, key="8A", low_energy_level=0.75)
    d2 = DeckState(deck_id=2, is_playing=True, bpm=128.0, key="8A", low_energy_level=0.72)
    alerts = DSPCleanRoomEngine.verificar_alertas_en_vivo(d1, d2)
    alert_types = [a.type for a in alerts]
    assert "ANTI_MUDDY" in alert_types

    # 2. Deck 2 en pausa -> No debe disparar alerta
    d2_paused = DeckState(deck_id=2, is_playing=False, bpm=128.0, key="8A", low_energy_level=0.72)
    alerts_paused = DSPCleanRoomEngine.verificar_alertas_en_vivo(d1, d2_paused)
    assert len(alerts_paused) == 0

    # 3. Deck 2 con graves recortados (Low EQ cut / low_energy_level=0.25) -> Safe
    d2_clean = DeckState(deck_id=2, is_playing=True, bpm=128.0, key="8A", low_energy_level=0.25)
    alerts_clean = DSPCleanRoomEngine.verificar_alertas_en_vivo(d1, d2_clean)
    assert "ANTI_MUDDY" not in [a.type for a in alerts_clean]


def test_copilot_prodjlink_packet_decoder():
    # Construir un paquete simulado de Beat Pioneer Pro DJ Link (0x28)
    # Magic header: ProDJLink (9 bytes) + \x00 + packet_type (0x28 en offset 0x0a)
    packet = bytearray(b"ProDJLink\x00")
    packet.append(0x28)  # offset 0x0a: type
    packet.extend(b"\x00" * 50)
    packet[0x21] = 2     # Player ID = 2
    # BPM 130.00 -> 13000 -> 0x00, 0x00, 0x32, 0xc8
    packet[0x2c:0x30] = (13000).to_bytes(4, byteorder="big")
    packet[0x27] = 0x03  # Flags: Playing (0x01) | Master (0x02)
    packet[0x34] = 3     # Beat 3

    parsed = ProDJLinkReceiver.decodificar_paquete(bytes(packet), "192.168.1.150")
    assert parsed is not None
    assert parsed["type"] == "BEAT_PACKET"
    assert parsed["player_id"] == 2
    assert parsed["bpm"] == 130.00
    assert parsed["beat"] == 3
    assert parsed["is_playing"] is True
    assert parsed["is_master"] is True


def test_copilot_platform_management():
    engine = CopilotEngine()
    platforms = engine.get_available_platforms()
    assert len(platforms) >= 5
    platform_ids = [p["id"] for p in platforms]
    assert "prodjlink" in platform_ids
    assert "os2l" in platform_ids
    assert "rekordbox" in platform_ids

    # Cambiar a modo Pro DJ Link
    res = engine.set_platform("prodjlink")
    assert res["platform"] == "prodjlink"

    # Cambiar master manualmente
    res_master = engine.set_manual_master(2)
    assert res_master["master_deck"] == 2


def test_copilot_to_camelot_conversion():
    assert DSPCleanRoomEngine.to_camelot("Am") == "8A"
    assert DSPCleanRoomEngine.to_camelot("A minor") == "8A"
    assert DSPCleanRoomEngine.to_camelot("Bbm") == "3A"
    assert DSPCleanRoomEngine.to_camelot("Bb minor") == "3A"
    assert DSPCleanRoomEngine.to_camelot("C") == "8B"
    assert DSPCleanRoomEngine.to_camelot("C maj") == "8B"
    assert DSPCleanRoomEngine.to_camelot("F#m") == "11A"
    assert DSPCleanRoomEngine.to_camelot("10A") == "10A"
    assert DSPCleanRoomEngine.to_camelot("Unknown") == "8A"


def test_copilot_library_reader_and_recommendations():
    engine = CopilotEngine()
    rutas = LibraryReader.detectar_rutas_locales()
    assert isinstance(rutas, dict)
    assert "rekordbox_db" in rutas
    assert "serato_dir" in rutas

    # Probar cambio a rekordbox si existe base de datos en el host
    if rutas.get("rekordbox_db"):
        res_rb = engine.set_platform("rekordbox")
        assert res_rb["platform"] == "rekordbox"
        assert res_rb["deck_1"]["artist"] != ""
        assert isinstance(res_rb.get("recommendations"), list)

    # Probar cambio a serato si existe carpeta en el host
    if rutas.get("serato_dir"):
        res_serato = engine.set_platform("serato")
        assert res_serato["platform"] == "serato"
        assert res_serato["deck_1"]["title"] != ""
        assert isinstance(res_serato.get("recommendations"), list)

    # Volver a simulación
    res_sim = engine.set_platform("simulation")
    assert res_sim["platform"] == "simulation"
    assert res_sim["deck_1"]["title"] == "Scream"
    assert res_sim["deck_2"]["title"] == "Your Touch"
