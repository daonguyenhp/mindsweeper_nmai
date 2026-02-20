from flask import Blueprint

# Tất cả đường dẫn tự động có dạng /api/....
api = Blueprint('api', __name__, url_prefix='/api')

# Import các routes con
from . import config_routes, score_routes