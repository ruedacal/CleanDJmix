from flask import Flask
from routers.spotify_router import spotify_bp
from routers.superflac_router import superflac_bp
from routers.itunes_router import itunes_bp

def register_blueprints(app: Flask):
    app.register_blueprint(spotify_bp)
    app.register_blueprint(superflac_bp)
    app.register_blueprint(itunes_bp)
    print("[OK] Todos los routers/blueprints registrados correctamente en la app.")