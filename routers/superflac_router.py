# routers/superflac_router.py
from flask import Blueprint, jsonify, request
from services.superflac_service import SuperFlacService

superflac_bp = Blueprint('superflac_bp', __name__)
flac_service = SuperFlacService()

@superflac_bp.route('/api/superflac/analyze', methods=['POST'])
def analyze_track():
    data = request.get_json() or {}
    file_path = data.get('path')
    
    if not file_path:
        return jsonify({"error": "Ruta de archivo requerida"}), 400
        
    result = flac_service.analyze_flac_file(file_path)
    if result.get("success"):
        return jsonify(result), 200
    return jsonify(result), 400