from flask import request
from flask_socketio import emit
from app import socketio

from app.services import game_service  

@socketio.on('connect')
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on('disconnect')
def handle_disconnect():
    game_service.remove_game(request.sid)

@socketio.on('start_game')
def handle_start_game(data):
    size = int(data.get('size', 9))
    mines = int(data.get('mines', 10))
    game_service.create_game(request.sid, size, mines)
    emit('init_board', {'size': size, 'mines': mines})

@socketio.on('click_cell')
def handle_click(data):
    r, c = data['r'], data['c']
    action = data['action']
    sid = request.sid

    if action == 'left':
        result = game_service.open_cell(sid, r, c)
        
        if result and result.get('status') in ['continue', 'win']:
             full_board = game_service.get_board_state(sid)
             grid_data = [[cell.to_dict() for cell in row] for row in full_board]
             emit('full_board_update', grid_data)
             
        if result: 
            emit('update_board', result)
            
    elif action == 'right':
        result = game_service.flag_cell(sid, r, c)
        if result: 
            emit('update_board', result)

@socketio.on('cheat_reveal')
def handle_cheat_reveal(data=None): 
    sid = request.sid
    engine = game_service.get_game(sid)
    
    if not engine or not engine.board:
        emit('minimap_data', [])
        return

    full_board = engine.board.grid
    grid_data = [[cell.to_dict(show_hidden=True) for cell in row] for row in full_board]
    emit('minimap_data', grid_data)