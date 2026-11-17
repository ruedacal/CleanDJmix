"""
BeatWave Live Copilot v2.0 (Clean-Room & Zero-Cost).
Núcleo modular de intercepción de cabina en tiempo real, DSP lock-free y telemetría de red.
"""

from services.copilot.models import DeckState, ClashAlert, LiveSessionState
from services.copilot.prodjlink import ProDJLinkReceiver
from services.copilot.os2l import OS2LReceiver
from services.copilot.library_reader import LibraryReader
from services.copilot.dsp_cleanroom import DSPCleanRoomEngine
from services.copilot.engine import CopilotEngine, copilot_engine

# Alias retrocompatible para el servidor web y tests
copilot_service = copilot_engine

__all__ = [
    "DeckState",
    "ClashAlert",
    "LiveSessionState",
    "ProDJLinkReceiver",
    "OS2LReceiver",
    "LibraryReader",
    "DSPCleanRoomEngine",
    "CopilotEngine",
    "copilot_engine",
    "copilot_service"
]
