# app/controllers/__init__.py

from .view_routes import view_bp
from .api_routes import api_bp
# socket_events không cần export Blueprint, nó tự đăng ký với socketio instance