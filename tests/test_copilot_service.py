import pytest
from services.copilot_service import CopilotService

def test_copilot_service_initialization():
    service = CopilotService(serato_db_path="/tmp/fake_serato.sqlite")
    assert service.serato_db_path == "/tmp/fake_serato.sqlite"
    assert service.simulation_mode is False

def test_copilot_to_camelot_conversion():
    service = CopilotService()
    assert service.to_camelot("8A") == "8A"
    assert service.to_camelot("Am") == "8A"
    assert service.to_camelot("Gm") == "6A"
    assert service.to_camelot("Dm") == "7A"
    assert service.to_camelot("Bm") == "10A"
    assert service.to_camelot("C") == "8B"
    assert service.to_camelot("F") == "7B"
    assert service.to_camelot("") == "8A"

def test_copilot_harmonic_relation():
    service = CopilotService()
    # Same
    rel_same = service._calculate_harmonic_relation("8A", "8A")
    assert rel_same["type"] == "perfect"

    # Energy up (+1)
    rel_up = service._calculate_harmonic_relation("8A", "9A")
    assert rel_up["type"] == "energy_up"

    # Deep / calm (-1)
    rel_down = service._calculate_harmonic_relation("8A", "7A")
    assert rel_down["type"] == "deep_calm"

    # Modal switch (8A <-> 8B)
    rel_mode = service._calculate_harmonic_relation("8A", "8B")
    assert rel_mode["type"] == "mode_switch"

    # Energy surge (+2)
    rel_surge = service._calculate_harmonic_relation("8A", "10A")
    assert rel_surge["type"] == "energy_surge"

    # Dissonant
    rel_diss = service._calculate_harmonic_relation("8A", "2A")
    assert rel_diss["type"] == "dissonant"

def test_copilot_anti_muddy_guard():
    service = CopilotService()
    
    # Both bass-heavy
    deck_heavy_a = {"low_ratio": 48.0, "acoustic_role": "Bass-Heavy"}
    deck_heavy_b = {"low_ratio": 46.0, "acoustic_role": "Bass-Heavy"}
    alert_heavy = service._calculate_anti_muddy_guard(deck_heavy_a, deck_heavy_b)
    assert alert_heavy["status"] == "danger"
    assert alert_heavy["tag"] == "BASS CLASH"

    # Clean percussive mix
    deck_clean = {"low_ratio": 32.0, "acoustic_role": "Percussive Tool"}
    alert_clean = service._calculate_anti_muddy_guard(deck_heavy_a, deck_clean)
    assert alert_clean["status"] == "safe"
    assert alert_clean["tag"] == "CLEAN MIX"

def test_copilot_simulation_mode():
    service = CopilotService()
    service.simulation_mode = True
    state = service.get_live_state()
    assert state["connected"] is True
    assert state["source"] == "SIMULATION_MODE"
    assert "deck_1" in state
    assert "deck_2" in state
    assert len(state["recommendations"]) == 3
    assert "local_ip" in state
