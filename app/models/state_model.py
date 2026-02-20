class GameState:
    def __init__(self, size, total_mines):
        self.game_over = False
        self.victory = False
        self.revealed_count = 0
        self.safe_cells_total = (size * size) - total_mines
        self.is_first_move = True
        self.ai_running = False