from flask import Blueprint, jsonify, request
# Import chuẩn cấu hình từ tầng Model
from app.models.config_model import GAME_LEVELS

# Tạo Blueprint tên là 'api'
api_bp = Blueprint('api', __name__)

@api_bp.route('/config', methods=['GET'])
def get_game_config():
    """API trả về cấu hình mặc định (Frontend dùng để render các mức độ khó)"""
    return jsonify(GAME_LEVELS)

@api_bp.route('/save-score', methods=['POST'])
def save_score():
    """Ví dụ API lưu điểm (Demo)"""
    data = request.json
    print(f"Lưu điểm cho user {data.get('user')}: {data.get('score')}")
    return jsonify({"status": "success", "message": "Đã lưu điểm!"})