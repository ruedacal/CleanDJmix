"""
Servidor de desarrollo web sin dependencias externas (solo librería estándar).

Sirve la carpeta `web/` igual que en el despliegue de Vercel, sin necesitar
Eel, Bottle ni el backend de audio de escritorio. Las funciones de escritorio
(eel.*) quedan desactivadas y la interfaz funciona en modo web.

La versión de escritorio sigue disponible con: npm run desktop
"""
import http.server
import os
import socketserver

WEB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "web")
PORT = int(os.environ.get("PORT", "3000"))


class WebHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/":
            entry = "studio.html" if os.path.exists(os.path.join(WEB_DIR, "studio.html")) else "index.html"
            self.path = "/" + entry
        elif path == "/eel.js":
            body = b"/* Modo web: Eel no disponible */\n"
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        elif path == "/api/health":
            body = b'{"status": "ok", "app": "BEATWAVE PRO", "runtime": "web-dev"}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


class ThreadedServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == "__main__":
    with ThreadedServer(("0.0.0.0", PORT), WebHandler) as httpd:
        print(f"BEATWAVE PRO web dev server en http://localhost:{PORT}")
        httpd.serve_forever()
