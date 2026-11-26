try:
    from flask import Flask
except ImportError:
    Flask = None
try:
    from routers.spotify_router import spotify_bp
except ImportError:
    spotify_bp = None
try:
    from routers.superflac_router import superflac_bp
except ImportError:
    superflac_bp = None
try:
    from routers.itunes_router import itunes_bp
except ImportError:
    itunes_bp = None

def register_blueprints(app: Flask):
    app.register_blueprint(spotify_bp)
    app.register_blueprint(superflac_bp)
    app.register_blueprint(itunes_bp)
    print("[OK] Todos los routers/blueprints registrados correctamente en la app.")
