"""
Pruebas unitarias completas para AuthAdapter (>90% cobertura).
"""

import os
import json
import pytest
from unittest.mock import patch, MagicMock
from infrastructure.auth_adapter import AuthAdapter

def test_get_client_exito_y_error():
    # Éxito
    with patch("supabase.create_client", return_value="cliente_mock"):
        AuthAdapter._client = None
        assert AuthAdapter.get_client() == "cliente_mock"

    # Fallo
    with patch.dict('sys.modules', {'supabase': None}):
        AuthAdapter._client = None
        assert AuthAdapter.get_client() is None

def test_login_con_email_variaciones():
    # 1. SDK con sign_in_with_password (dict / kwargs)
    mock_client = MagicMock()
    mock_res = MagicMock()
    mock_res.user.id = "uid-1"
    mock_res.user.email = "u@dj.com"
    mock_res.session.access_token = "tok"
    mock_client.auth.sign_in_with_password.return_value = mock_res

    with patch.object(AuthAdapter, 'get_client', return_value=mock_client), \
         patch.object(AuthAdapter, 'obtener_perfil', return_value={"is_active": True, "role": "admin"}), \
         patch.object(AuthAdapter, 'guardar_sesion_local'):
        res = AuthAdapter.login_con_email("u@dj.com", "pass")
        assert res["success"] is True

    # 2. SDK con sign_in alternativo (TypeError fallback)
    mock_client2 = MagicMock()
    del mock_client2.auth.sign_in_with_password
    mock_client2.auth.sign_in.side_effect = [TypeError("wrong args"), mock_res]
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client2), \
         patch.object(AuthAdapter, 'obtener_perfil', return_value={"is_active": True, "role": "admin"}), \
         patch.object(AuthAdapter, 'guardar_sesion_local'):
        res2 = AuthAdapter.login_con_email("u@dj.com", "pass")
        assert res2["success"] is True

    # 3. Sin métodos válidos
    mock_client3 = MagicMock()
    del mock_client3.auth.sign_in_with_password
    del mock_client3.auth.sign_in
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client3):
        assert AuthAdapter.login_con_email("u@dj.com", "pass")["success"] is False

    # 4. Cuenta inactiva
    mock_client4 = MagicMock()
    mock_client4.auth.sign_in_with_password.return_value = mock_res
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client4), \
         patch.object(AuthAdapter, 'obtener_perfil', return_value={"is_active": False, "role": "user"}):
        res_inactiva = AuthAdapter.login_con_email("u@dj.com", "pass")
        assert res_inactiva["success"] is False
        assert "desactivada" in res_inactiva["error"]

def test_login_fallo_y_excepcion():
    with patch.object(AuthAdapter, 'get_client', return_value=None):
        assert AuthAdapter.login_con_email("a@b.com", "p")["success"] is False

    mock_client = MagicMock()
    mock_client.auth.sign_in_with_password.side_effect = Exception("Credenciales invalidas")
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client):
        assert AuthAdapter.login_con_email("a@b.com", "p")["success"] is False

def test_registro_con_email_ramas():
    with patch.object(AuthAdapter, 'get_client', return_value=None):
        assert AuthAdapter.registro_con_email("a@b.com", "123")["success"] is False

    mock_client = MagicMock()
    mock_res = MagicMock()
    mock_res.user = MagicMock()
    mock_client.auth.sign_up.return_value = mock_res
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client):
        res = AuthAdapter.registro_con_email("a@b.com", "123")
        assert res["success"] is True

    # Fallo o ya registrado
    mock_client.auth.sign_up.side_effect = Exception("User already registered")
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client):
        res_err = AuthAdapter.registro_con_email("a@b.com", "123")
        assert res_err["success"] is False

def test_obtener_perfil_ramas():
    # Sin cliente
    with patch.object(AuthAdapter, 'get_client', return_value=None):
        assert AuthAdapter.obtener_perfil("123")["role"] == "admin"

    # Con datos
    mock_client = MagicMock()
    mock_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{"role": "dj", "is_active": True}]
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client):
        p = AuthAdapter.obtener_perfil("123")
        assert p["role"] == "dj"

    # Error en query
    mock_client.table.side_effect = Exception("DB error")
    with patch.object(AuthAdapter, 'get_client', return_value=mock_client):
        assert AuthAdapter.obtener_perfil("123")["role"] == "admin"

def test_sesion_local_ciclo(tmp_path):
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
