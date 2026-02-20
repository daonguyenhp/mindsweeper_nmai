from flask import jsonify
from . import api
from app.models.config_model import GAME_LEVELS

@api.route('/config', methods=['GET'])
def get_game_config():
    return jsonify(GAME_LEVELS)