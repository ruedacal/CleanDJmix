import sys
from unittest.mock import MagicMock

if 'eel' not in sys.modules:
    mock_eel = MagicMock()
    mock_eel.expose = lambda f: f
    sys.modules['eel'] = mock_eel
