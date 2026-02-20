from flask import request
from flask_socketio import emit
from app import socketio

from app.services import game_service, ai_service

@socketio.on('run_ai')
def handle_run_ai(data):
    sid = request.sid
    engine = game_service.get_game(sid)
    
    if not engine:
        return
    
    algo_type = data.get('algo', 'dfs') 
    ai_service.start_solving_background(sid, engine, algo_type)

@socketio.on('stop_ai')
def handle_stop_ai():
    sid = request.sid
    engine = game_service.get_game(sid)
    
    if engine:
        engine.ai_running = False