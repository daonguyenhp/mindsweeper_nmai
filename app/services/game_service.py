from app.services.game_logic.engine import GameEngine

class GameService:
    def __init__(self):
        self.games = {}

    def get_game(self, sid):
        return self.games.get(sid)

    def create_game(self, sid, size=9, mines=10):
        engine = GameEngine(size, mines)
        self.games[sid] = engine
        return engine

    def remove_game(self, sid):
        if sid in self.games:
            del self.games[sid]

    def open_cell(self, sid, r, c):
        engine = self.get_game(sid)
        if not engine: return {"status": "error", "message": "Game not found"}
        return engine.process_click(r, c)

    def flag_cell(self, sid, r, c):
        engine = self.get_game(sid)
        if not engine: return None
        return engine.process_flag(r, c)

    def get_board_state(self, sid):
        engine = self.get_game(sid)
        if not engine: return []
        return engine.board.grid