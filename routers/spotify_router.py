from flask import Blueprint, jsonify, request
from services.spotify_client import SpotifyService

spotify_bp = Blueprint('spotify_bp', __name__)
spotify_service = SpotifyService()

@spotify_bp.route('/api/spotify/search', methods=['POST'])
def search_spotify_track():
    data = request.get_json() or {}
    query = data.get('query')
    
    if not query:
        return jsonify({"error": "Parámetro 'query' requerido"}), 400
        
    sp = spotify_service.get_client()
    if not sp:
        return jsonify({"error": "Credenciales de Spotify no configuradas o token inválido"}), 401
        
    result = spotify_service.search_track(sp, query)
    if result:
        return jsonify({"success": True, "track": result}), 200
    return jsonify({"success": False, "message": "Pista no encontrada"}), 404
