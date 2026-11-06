"""
Pruebas exhaustivas para AuthAdapter (>95% de cobertura).
"""

import os
import pytest
from unittest.mock import patch, MagicMock
from infrastructure.auth_adapter import AuthAdapter

def test_get_client_ramas():
    with patch("supabase.create_client", return_value="mock_client"):
        AuthAdapter._client = None
        assert AuthAdapter.get_client() == "mock_client"

    with patch.dict('sys.modules', {'supabase': None}):
        AuthAdapter._client = None
        assert AuthAdapter.get_client() is None

def test_login_con_email_ramas():
    # 1. Éxito
    mock_client = MagicMock()
    mock_res = MagicMock()
    mock_res.user.id = "uid-1"
    mock_res.user.email = "dj@test.com"
    mock_res.session.access_token = "token123"
    mock_client.auth.sign_in_with_password.return_value = mock_res

    with patch.object(AuthAdapter, 'get_client', return_value=mock_client), \
         patch.object(AuthAdapter, 'obtener_perfil', return_value={"is_active": True, "role": "admin"}), \
         patch.object(AuthAdapter, 'guardar_sesion_local'):
        res = AuthAdapter.login_con_email("dj@test.com", "pass")
        assert res["success"] is True

    # 2. Cuenta desactivada
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client), \
         patch.object(AuthAdapter, 'obtener_perfil', return_value={"is_active": False, "role": "user"}):
        res_inactiva = AuthAdapter.login_con_email("dj@test.com", "pass")
        assert res_inactiva["success"] is False
        assert "desactivada" in res_inactiva["error"]

    # 3. Fallback TypeError
    mock_client2 = MagicMock()
    del mock_client2.auth.sign_in_with_password
    mock_client2.auth.sign_in.side_effect = [TypeError("wrong args"), mock_res]
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client2), \
         patch.object(AuthAdapter, 'obtener_perfil', return_value={"is_active": True, "role": "admin"}), \
         patch.object(AuthAdapter, 'guardar_sesion_local'):
        res2 = AuthAdapter.login_con_email("dj@test.com", "pass")
        assert res2["success"] is True

    # 4. Sin métodos válidos
    mock_client3 = MagicMock()
    del mock_client3.auth.sign_in_with_password
    del mock_client3.auth.sign_in
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client3):
        assert AuthAdapter.login_con_email("dj@test.com", "pass")["success"] is False

    # 5. Sin cliente
    with patch.object(AuthAdapter, 'get_client', return_value=None):
        assert AuthAdapter.login_con_email("dj@test.com", "pass")["success"] is False

    # 6. Excepción general
    mock_client.auth.sign_in_with_password.side_effect = Exception("Credenciales erróneas")
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client):
        assert AuthAdapter.login_con_email("dj@test.com", "pass")["success"] is False

def test_registro_con_email():
    with patch.object(AuthAdapter, 'get_client', return_value=None):
        assert AuthAdapter.registro_con_email("a@b.com", "123")["success"] is False

    mock_client = MagicMock()
    mock_res = MagicMock()
    mock_res.user = MagicMock()
    mock_client.auth.sign_up.return_value = mock_res
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client):
        assert AuthAdapter.registro_con_email("a@b.com", "123")["success"] is True

    mock_client.auth.sign_up.side_effect = Exception("User already registered")
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client):
        assert AuthAdapter.registro_con_email("a@b.com", "123")["success"] is False

def test_obtener_perfil():
    with patch.object(AuthAdapter, 'get_client', return_value=None):
        assert AuthAdapter.obtener_perfil("123")["role"] == "admin"

    mock_client = MagicMock()
    mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{"role": "dj", "is_active": True}]
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client):
        assert AuthAdapter.obtener_perfil("123")["role"] == "dj"

    mock_client.table.side_effect = Exception("Error SQL")
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client):
        assert AuthAdapter.obtener_perfil("123")["role"] == "admin"

def test_sesion_local(tmp_path):
    archivo = tmp_path / "sesion.json"
    with patch('infrastructure.auth_adapter.SESSION_CACHE_FILE', str(archivo)):
        AuthAdapter.guardar_sesion_local("tok", "uid", "mail@dj.com")
        assert os.path.exists(str(archivo))

        with patch.object(AuthAdapter, 'obtener_perfil', return_value={"is_active": True}):
            s = AuthAdapter.cargar_sesion_local()
            assert s["user_id"] == "uid"

        with patch.object(AuthAdapter, 'obtener_perfil', return_value={"is_active": False}):
            assert AuthAdapter.cargar_sesion_local() is None

        AuthAdapter.cerrar_sesion()
        assert not os.path.exists(str(archivo))
        assert AuthAdapter.cargar_sesion_local() is None
