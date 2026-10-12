"""
Pruebas unitarias para AuthAdapter (cobertura >90%).
"""

import os
import json
import pytest
from unittest.mock import patch, MagicMock
from infrastructure.auth_adapter import AuthAdapter

def test_get_client_error():
    with patch.dict('sys.modules', {'supabase': None}):
        AuthAdapter._client = None
        assert AuthAdapter.get_client() is None

def test_login_con_email_exito():
    mock_client = MagicMock()
    mock_res = MagicMock()
    mock_res.user.id = "user-123"
    mock_res.user.email = "test@dj.com"
    mock_res.session.access_token = "token-abc"
    mock_client.auth.sign_in_with_password.return_value = mock_res
    
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client), \
         patch.object(AuthAdapter, 'obtener_perfil', return_value={"is_active": True, "role": "admin"}), \
         patch.object(AuthAdapter, 'guardar_sesion_local'):
        
        res = AuthAdapter.login_con_email("test@dj.com", "pass123")
        assert res["success"] is True
        assert res["profile"]["role"] == "admin"

def test_login_cuenta_desactivada():
    mock_client = MagicMock()
    mock_res = MagicMock()
    mock_res.user.id = "user-123"
    mock_client.auth.sign_in_with_password.return_value = mock_res
    
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client), \
         patch.object(AuthAdapter, 'obtener_perfil', return_value={"is_active": False}):
        
        res = AuthAdapter.login_con_email("test@dj.com", "pass123")
        assert res["success"] is False
        assert "desactivada" in res["error"]

def test_login_error_general():
    with patch.object(AuthAdapter, 'get_client', return_value=None):
        res = AuthAdapter.login_con_email("test@dj.com", "pass123")
        assert res["success"] is False

    mock_client = MagicMock()
    mock_client.auth.sign_in_with_password.side_effect = Exception("Credenciales invalidas")
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client):
        res2 = AuthAdapter.login_con_email("test@dj.com", "pass123")
        assert res2["success"] is False

def test_registro_rutas():
    with patch.object(AuthAdapter, 'get_client', return_value=None):
        assert AuthAdapter.registro_con_email("a@b.com", "123")["success"] is False

    mock_client = MagicMock()
    mock_res = MagicMock()
    mock_res.user = MagicMock()
    mock_client.auth.sign_up.return_value = mock_res
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client):
        res = AuthAdapter.registro_con_email("a@b.com", "123")
        assert res["success"] is True

def test_sesion_local(tmp_path):
    archivo_sesion = tmp_path / "sesion.json"
    with patch('infrastructure.auth_adapter.SESSION_CACHE_FILE', str(archivo_sesion)):
        AuthAdapter.guardar_sesion_local("tok", "uid", "mail@dj.com")
        assert os.path.exists(str(archivo_sesion))
        
        with patch.object(AuthAdapter, 'obtener_perfil', return_value={"is_active": True}):
            sesion = AuthAdapter.cargar_sesion_local()
            assert sesion is not None
            assert sesion["user_id"] == "uid"
            
        AuthAdapter.cerrar_sesion()
        assert not os.path.exists(str(archivo_sesion))
