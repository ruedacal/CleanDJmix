# routers/itunes_router.py
from flask import Blueprint, jsonify, request
from services.itunes_service import iTunesService

itunes_bp = Blueprint('itunes_bp', __name__)
itunes_service = iTunesService()

@itunes_bp.route('/api/itunes/library', methods=['POST'])
def load_library():
    data = request.get_json() or {}
    xml_path = data.get('xml_path')
    
    if not xml_path:
        return jsonify({"error": "Ruta del archivo XML de iTunes requerida"}), 400
        
    result = itunes_service.parse_library_xml(xml_path)
    if result.get("success"):
        return jsonify(result), 200
    return jsonify(result), 400