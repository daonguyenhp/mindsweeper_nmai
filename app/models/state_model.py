class GameState:
    def __init__(self, size, total_mines):
        self.game_over = False
        self.victory = False
        self.revealed_count = 0
        self.flagged_count = 0          # Track flagged mines
        self.total_mines = total_mines  # Immutable total for game logic
        self.remaining_mines = total_mines  # UI/display counter (decreases/increases with flags)
        self.safe_cells_total = (size * size) - total_mines
        self.is_first_move = True
        self.ai_running = False