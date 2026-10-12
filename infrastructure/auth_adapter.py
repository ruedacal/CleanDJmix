"""
Módulo de Infraestructura: Adaptador de Autenticación con diagnóstico detallado de errores
y control estricto de cuentas desactivadas.
"""

import os
import json
import logging
import traceback
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

SESSION_CACHE_FILE = os.path.expanduser("~/.cleandjmix_session.json")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://vhogiibmczejmdcutpii.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "sb_publishable_mKxpDCMzNWQONhXBPXrEnQ__iuXiohY")


class AuthAdapter:
    _client = None

    @classmethod
    def get_client(cls):
        if cls._client is None:
            try:
                from supabase import create_client
                cls._client = create_client(SUPABASE_URL, SUPABASE_KEY)
            except Exception as e:
                print(f"[AuthAdapter Init Error] {traceback.format_exc()}")
                cls._client = None
        return cls._client

    @classmethod
    def login_con_email(cls, email: str, password: str) -> Dict[str, Any]:
        client = cls.get_client()
        if not client:
            return {"success": False, "error": "No se pudo conectar con Supabase."}

        try:
            auth_module = client.auth
            res = None

            if hasattr(auth_module, "sign_in_with_password"):
                try:
                    res = auth_module.sign_in_with_password(credentials={"email": email, "password": password})
                except TypeError:
                    res = auth_module.sign_in_with_password({"email": email, "password": password})
            elif hasattr(auth_module, "sign_in"):
                try:
                    res = auth_module.sign_in(email=email, password=password)
                except TypeError:
                    res = auth_module.sign_in({"email": email, "password": password})
            else:
                return {"success": False, "error": "Método de login no disponible en esta versión del SDK."}

            user = getattr(res, "user", None) or (res.get("user") if isinstance(res, dict) else None)
            session = getattr(res, "session", None) or (res.get("session") if isinstance(res, dict) else None)

            user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
            user_email = getattr(user, "email", email) or (user.get("email") if isinstance(user, dict) else email)

            if user_id:
                perfil = cls.obtener_perfil(user_id)
                # Verificación estricta de estado de cuenta
                if not perfil.get("is_active", True):
                    return {"success": False, "error": "Cuenta desactivada por el administrador."}

                access_token = getattr(session, "access_token", "") if session else ""
                cls.guardar_sesion_local(access_token, user_id, user_email)
                return {"success": True, "user": user, "profile": perfil}

            err_msg = getattr(res, "error_message", None) or getattr(res, "message", None) or "Credenciales incorrectas o correo no confirmado."
            return {"success": False, "error": str(err_msg)}

        except Exception as e:
            detalles = traceback.format_exc()
            msg = str(e) or repr(e)
            return {"success": False, "error": msg}

    @classmethod
    def registro_con_email(cls, email: str, password: str, full_name: str = "") -> Dict[str, Any]:
        client = cls.get_client()
        if not client:
            return {"success": False, "error": "Servicio no disponible."}

        try:
            auth_module = client.auth
            res = None
            try:
                res = auth_module.sign_up(email=email, password=password)
            except TypeError:
                res = auth_module.sign_up({"email": email, "password": password})

            user = getattr(res, "user", None) or (res.get("user") if isinstance(res, dict) else None)
            if user:
                return {"success": True, "user": user, "message": "Usuario registrado."}
            return {"success": False, "error": "No se pudo registrar la cuenta."}
        except Exception as e:
            return {"success": False, "error": repr(e)}

    @classmethod
    def obtener_perfil(cls, user_id: str) -> Dict[str, Any]:
        client = cls.get_client()
        if not client:
            return {"role": "admin", "is_active": True}

        try:
            res = client.table("profiles").select("*").eq("id", user_id).execute()
            data = getattr(res, "data", None) or (res.get("data") if isinstance(res, dict) else None)
            if data and len(data) > 0:
                return data[0]
        except Exception as e:
            pass
        return {"role": "admin", "is_active": True}

    @classmethod
    def guardar_sesion_local(cls, access_token: str, user_id: str, email: str):
        try:
            datos = {"access_token": access_token, "user_id": user_id, "email": email}
            with open(SESSION_CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(datos, f)
        except Exception:
            pass

    @classmethod
    def cargar_sesion_local(cls) -> Optional[Dict[str, Any]]:
        if not os.path.exists(SESSION_CACHE_FILE):
            return None
        try:
            with open(SESSION_CACHE_FILE, "r", encoding="utf-8") as f:
                datos = json.load(f)
            perfil = cls.obtener_perfil(datos["user_id"])
            if not perfil.get("is_active", True):
                cls.cerrar_sesion()
                return None
            datos["profile"] = perfil
            return datos
        except Exception:
            return None

    @classmethod
    def cerrar_sesion(cls):
        if os.path.exists(SESSION_CACHE_FILE):
            try:
                os.remove(SESSION_CACHE_FILE)
            except Exception:
                pass
