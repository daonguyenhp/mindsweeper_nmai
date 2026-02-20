from flask import Blueprint, jsonify, request

# Tạo Blueprint tên là 'api'
api_bp = Blueprint('api', __name__)

@api_bp.route('/config', methods=['GET'])
def get_game_config():
    """API trả về cấu hình mặc định (Ví dụ để Frontend biết các mức độ khó)"""
    configs = {
        "tiny": {"size": 5, "mines": 3},
        "beginner": {"size": 9, "mines": 10},
        "intermediate": {"size": 16, "mines": 40},
        "expert": {"size": 16, "mines": 99} 
    }
    return jsonify(configs)

@api_bp.route('/save-score', methods=['POST'])
def save_score():
    """Ví dụ API lưu điểm (Demo)"""
    data = request.json
    print(f"Lưu điểm cho user {data.get('user')}: {data.get('score')}")
    return jsonify({"status": "success", "message": "Đã lưu điểm!"})