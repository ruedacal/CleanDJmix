import pytest
import os
from services.copilot_service import CopilotService

def test_copilot_service_initialization():
    service = CopilotService(serato_db_path="/tmp/fake_serato.sqlite")
    assert service.serato_db_path == "/tmp/fake_serato.sqlite"
    assert service.simulation_mode is False
    assert service.platform_mode == "auto"

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
    assert "platform" in state
    assert "platform_icon" in state

def test_copilot_platform_selection():
    service = CopilotService()
    assert service.platform_mode == "auto"

    service.set_platform("rekordbox")
    assert service.platform_mode == "rekordbox"
    state = service.get_live_state()
    assert state["platform"] == "rekordbox"
    assert state["platform_name"] == "Pioneer Rekordbox"
    assert state["platform_icon"] == "🎛️"

    service.set_platform("virtualdj")
    assert service.platform_mode == "virtualdj"
    state = service.get_live_state()
    assert state["platform"] == "virtualdj"
    assert state["platform_name"] == "VirtualDJ Pro"
    assert state["platform_icon"] == "🎧"

    service.set_platform("traktor")
    assert service.platform_mode == "traktor"
    state = service.get_live_state()
    assert state["platform"] == "traktor"
    assert state["platform_name"] == "Native Instruments Traktor"
    assert state["platform_icon"] == "⚡"

def test_copilot_available_platforms():
    service = CopilotService()
    platforms = service.get_available_platforms()
    assert len(platforms) == 4
    platform_ids = [p["id"] for p in platforms]
    assert "serato" in platform_ids
    assert "rekordbox" in platform_ids
    assert "virtualdj" in platform_ids
    assert "traktor" in platform_ids

def test_copilot_virtualdj_m3u_parser(tmp_path):
    service = CopilotService()
    vdj_dir = tmp_path / "VirtualDJ"
    history_dir = vdj_dir / "History"
    history_dir.mkdir(parents=True)
    
    m3u_file = history_dir / "2026-10-26.m3u"
    m3u_content = """#EXTM3U
#EXTVDJ:<time>12:00:00</time><deck>1</deck>
#EXTINF:320,Amelie Lens - Higher
/Users/admin/Music/Higher.mp3
#EXTVDJ:<time>12:05:00</time><deck>2</deck>
#EXTINF:380,Adam Beyer - Your Mind
/Users/admin/Music/Your Mind.mp3
"""
    m3u_file.write_text(m3u_content, encoding="utf-8")
    service.virtualdj_dir = str(vdj_dir)
    
    entries = service._query_virtualdj_history()
    assert len(entries) == 2
    assert entries[0]["name"] == "Your Mind" # Most recent first
    assert entries[0]["artist"] == "Adam Beyer"
    assert entries[1]["name"] == "Higher"
    assert entries[1]["artist"] == "Amelie Lens"

def test_copilot_traktor_nml_parser(tmp_path):
    service = CopilotService()
    traktor_dir = tmp_path / "Traktor"
    history_dir = traktor_dir / "History"
    history_dir.mkdir(parents=True)

    nml_file = history_dir / "history.nml"
    nml_content = """<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<NML VERSION="19">
<HEAD COMPANY="www.native-instruments.com" PROGRAM="Traktor"/>
<COLLECTION ENTRIES="2">
<ENTRY ARTIST="Charlotte de Witte" TITLE="Doppler">
  <LOCATION DIR="/:Music/:" FILE="Doppler.mp3" VOLUME="Macintosh HD"/>
  <INFO KEY="8A"/>
  <TEMPO BPM="132.000000"/>
</ENTRY>
<ENTRY ARTIST="Enrico Sangiuliano" TITLE="Future Acid">
  <LOCATION DIR="/:Music/:" FILE="Future Acid.mp3" VOLUME="Macintosh HD"/>
  <INFO KEY="9A"/>
  <TEMPO BPM="132.500000"/>
</ENTRY>
</COLLECTION>
<PLAYLISTS>
  <NODE TYPE="FOLDER" NAME="$ROOT">
    <SUBNODES COUNT="1">
      <NODE TYPE="PLAYLIST" NAME="session">
        <PLAYLIST ENTRIES="2" TYPE="LIST">
          <ENTRY DECK="A">
            <PRIMARYKEY KEY="Macintosh HD/:Music/:Doppler.mp3" TYPE="TRACK"/>
          </ENTRY>
          <ENTRY DECK="B">
            <PRIMARYKEY KEY="Macintosh HD/:Music/:Future Acid.mp3" TYPE="TRACK"/>
          </ENTRY>
        </PLAYLIST>
      </NODE>
    </SUBNODES>
  </NODE>
</PLAYLISTS>
</NML>
"""
    nml_file.write_text(nml_content, encoding="utf-8")
    service.traktor_dir = str(traktor_dir)

    entries = service._query_traktor_history()
    assert len(entries) == 2
    assert entries[0]["artist"] in ["Enrico Sangiuliano", "Charlotte de Witte"]

def test_copilot_rekordbox_xml_parser(tmp_path):
    service = CopilotService()
    rb_dir = tmp_path / "rekordbox"
    rb_dir.mkdir(parents=True)

    xml_file = rb_dir / "rekordbox.xml"
    xml_content = """<?xml version="1.0" encoding="UTF-8"?>
<DJ_PLAYLISTS Version="1.0.0">
  <COLLECTION Entries="2">
    <TRACK TrackID="101" Name="Komodo" Artist="Mauro Picotto" AverageBpm="137.68" Tonality="10A" Location="file://localhost/Music/Komodo.mp3"/>
    <TRACK TrackID="102" Name="Smooth Mind" Artist="Marco Bailey" AverageBpm="140.00" Tonality="6A" Location="file://localhost/Music/Smooth.mp3"/>
  </COLLECTION>
  <PLAYLISTS>
    <NODE Type="0" Name="ROOT">
      <NODE Type="1" Name="HISTORY 2026" KeyType="0" Entries="2">
        <TRACK Key="101"/>
        <TRACK Key="102"/>
      </NODE>
    </NODE>
  </PLAYLISTS>
</DJ_PLAYLISTS>
"""
    xml_file.write_text(xml_content, encoding="utf-8")
    service.rekordbox_dir = str(rb_dir)

    entries = service._query_rekordbox_history()
    assert len(entries) == 2
    assert entries[0]["name"] == "Komodo"
    assert entries[0]["bpm"] == 137.68
    assert entries[0]["camelot"] == "10A"
    assert entries[1]["name"] == "Smooth Mind"
