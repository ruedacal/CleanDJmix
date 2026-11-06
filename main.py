"""
Punto de entrada principal para CleanDJmix / BeatWave PRO.
Exporta la aplicación WSGI ("app", "application", "handler") para despliegues Serverless / Vercel / Cloud,
y mantiene la ejecución de escritorio local mediante main() cuando se ejecuta directamente.
"""

import sys
import os

# ── WSGI / ASGI Entrypoint para Vercel, PaaS y Serverless ────────────────────
try:
    import bottle

    # Aplicación base ligera para respuestas instantáneas sin cold-starts pesados
    _base_app = bottle.Bottle()

    @_base_app.route("/")
    def _index():
        root_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")
        if os.path.exists(os.path.join(root_dir, "studio.html")):
            return bottle.static_file("studio.html", root=root_dir)
        return bottle.static_file("index.html", root=root_dir)

    @_base_app.route("/api/health")
    def _health():
        bottle.response.content_type = "application/json"
        return '{"status": "ok", "app": "BEATWAVE PRO", "version": "2.4", "runtime": "serverless"}'

    # Carga perezosa (lazy) de main_web para no bloquear la importación durante el build en Vercel
    _main_web_loaded = False
    _main_web_app = None

    def _get_web_app():
        global _main_web_loaded, _main_web_app
        if not _main_web_loaded:
            _main_web_loaded = True
            try:
                import main_web
                _main_web_app = main_web.bottle.default_app()
            except Exception as _e:
                print(f"[BEATWAVE Serverless] Fallback activo ({_e})")
                _main_web_app = None
        return _main_web_app

    def handler(environ, start_response):
        path = environ.get("PATH_INFO", "")
        # Rutas prioritarias directas (salud y raíz)
        if path in ("/", "/api/health"):
            return _base_app(environ, start_response)

        # Delegar en el backend completo si está disponible
        full_app = _get_web_app()
        if full_app:
            return full_app(environ, start_response)
        return _base_app(environ, start_response)

    app = handler
    application = handler

except Exception:
    def handler(environ, start_response):
        start_response("200 OK", [("Content-Type", "application/json")])
        return [b'{"status": "ok", "app": "BEATWAVE PRO"}']

    app = handler
    application = handler


# ── Launcher de Escritorio Local ─────────────────────────────────────────────
def main():
    print("[CleanDJmix PRO] Comprobando sesión local...")
    try:
        from infrastructure.auth_adapter import AuthAdapter
        sesion = AuthAdapter.cargar_sesion_local()
    except Exception as e:
        print(f"[CleanDJmix PRO] Error cargando sesión local: {e}")
        sesion = None

    perfil = None
    if sesion:
        print(f"[CleanDJmix PRO] Sesión activa encontrada para: {sesion.get('email')}")
        perfil = sesion.get("profile")
    else:
        print("[CleanDJmix PRO] No hay sesión previa. Abriendo pantalla de autenticación...")
        from ui.login_window import LoginWindow

        login_app = LoginWindow()
        login_app.mainloop()

        if not login_app.auth_perfil:
            print("[CleanDJmix PRO] Inicio de sesión cancelado o incompleto.")
            sys.exit(0)

        perfil = login_app.auth_perfil

    print(f"[CleanDJmix PRO] Cargando Suite Principal (Rol: {perfil.get('role', 'user') if perfil else 'user'})...")
    from ui.app_ui import CleanDJmixApp
    local_app = CleanDJmixApp()
    local_app.mainloop()


if __name__ == "__main__":
    main()
