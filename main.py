"""
Punto de entrada principal para CleanDJmix PRO con transición limpia de sesión.
"""

import sys
from infrastructure.auth_adapter import AuthAdapter

def main():
    print("[CleanDJmix PRO] Comprobando sesión local...")
    sesion = AuthAdapter.cargar_sesion_local()
    
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

    print(f"[CleanDJmix PRO] Cargando Suite Principal (Rol: {perfil.get('role', 'user')})...")
    from ui.app_ui import CleanDJmixApp
    app = CleanDJmixApp()
    app.mainloop()

if __name__ == "__main__":
    main()
