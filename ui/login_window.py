"""
Módulo UI: Ventana de Autenticación y Registro para CleanDJmix PRO.
"""

import customtkinter as ctk
from infrastructure.auth_adapter import AuthAdapter


class LoginWindow(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.auth_perfil = None
        
        self.title("CleanDJmix PRO - Iniciar Sesión")
        self.geometry("420x520")
        self.resizable(False, False)
        self.configure(fg_color="#181818")
        
        # Título
        ctk.CTkLabel(
            self, 
            text="CleanDJmix PRO", 
            font=ctk.CTkFont(family="Helvetica", size=22, weight="bold"), 
            text_color="#00AEEF"
        ).pack(pady=(35, 4))
        
        ctk.CTkLabel(
            self, 
            text="Inicia sesión para validar tu licencia DJ", 
            font=ctk.CTkFont(size=11), 
            text_color="#888888"
        ).pack(pady=(0, 25))

        # Formulario
        form_frame = ctk.CTkFrame(self, fg_color="#222222", corner_radius=8)
        form_frame.pack(fill="x", padx=35, pady=5, ipady=15, ipadx=10)

        ctk.CTkLabel(form_frame, text="CORREO ELECTRÓNICO", font=ctk.CTkFont(size=10, weight="bold"), text_color="#AAAAAA").pack(anchor="w", padx=15, pady=(5, 2))
        self.entry_email = ctk.CTkEntry(form_frame, height=36, fg_color="#181818", text_color="#FFFFFF")
        self.entry_email.insert(0, "rueda.v@gmail.com")
        self.entry_email.pack(fill="x", padx=15, pady=(0, 10))

        ctk.CTkLabel(form_frame, text="CONTRASEÑA", font=ctk.CTkFont(size=10, weight="bold"), text_color="#AAAAAA").pack(anchor="w", padx=15, pady=(5, 2))
        self.entry_pass = ctk.CTkEntry(form_frame, height=36, fg_color="#181818", text_color="#FFFFFF", show="*")
        self.entry_pass.pack(fill="x", padx=15, pady=(0, 15))

        # Botón de Login
        self.btn_login = ctk.CTkButton(
            form_frame, 
            text="Acceder", 
            command=self._ejecutar_login,
            fg_color="#00AEEF", 
            text_color="#000000", 
            font=ctk.CTkFont(weight="bold"), 
            height=38
        )
        self.btn_login.pack(fill="x", padx=15, pady=(5, 5))

        # Botón de Registro
        self.btn_reg = ctk.CTkButton(
            form_frame, 
            text="Crear Cuenta Nueva", 
            command=self._ejecutar_registro,
            fg_color="#333333", 
            hover_color="#444444",
            text_color="#FFFFFF", 
            height=34
        )
        self.btn_reg.pack(fill="x", padx=15, pady=(5, 5))

        # Mensaje de estado
        self.lbl_msg = ctk.CTkLabel(self, text="", font=ctk.CTkFont(size=11), text_color="#FF4444")
        self.lbl_msg.pack(pady=15)

    def _ejecutar_login(self):
        email = self.entry_email.get().strip()
        password = self.entry_pass.get().strip()
        
        if not email or not password:
            self.lbl_msg.configure(text="Introduce correo y contraseña.", text_color="#FF4444")
            return
            
        self.btn_login.configure(state="disabled", text="Validando...")
        self.update()
        
        print(f"[Auth] Intentando iniciar sesión para {email}...")
        res = AuthAdapter.login_con_email(email, password)
        self.btn_login.configure(state="normal", text="Acceder")
        
        if res.get("success"):
            print("[Auth] ¡Login exitoso! Abriendo CleanDJmix PRO...")
            self.auth_perfil = res.get("profile", {"role": "admin"})
            self.destroy()
            self.quit()
        else:
            error_texto = res.get("error", "Error al iniciar sesión")
            print(f"[Auth Error] {error_texto}")
            self.lbl_msg.configure(text=error_texto, text_color="#FF4444")

    def _ejecutar_registro(self):
        email = self.entry_email.get().strip()
        password = self.entry_pass.get().strip()
        
        if not email or len(password) < 6:
            self.lbl_msg.configure(text="Contraseña mínima de 6 caracteres.", text_color="#FF4444")
            return
            
        res = AuthAdapter.registro_con_email(email, password)
        if res.get("success"):
            self.lbl_msg.configure(text=res.get("message", "Cuenta creada. Pulsa 'Acceder'."), text_color="#00FF88")
        else:
            self.lbl_msg.configure(text=res.get("error", "Error en el registro"), text_color="#FF4444")
