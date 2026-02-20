from app import socketio
from .game_service import GameService
from .ai_service import AIService

# Game Service không cần socketio
game_service = GameService()

# AI Service CẦN socketio để gửi tin nhắn trong background thread
# Đây chính là chỗ fix lỗi "missing 1 required positional argument"
ai_service = AIService(socketio)