from .cell_model import Cell

class Board:
    def __init__(self, size, mines):
        self.size = size
        self.total_mines = mines
        # Tạo lưới các Cell
        self.grid = [[Cell(r, c) for c in range(size)] for r in range(size)]
    
    def get_cell(self, r, c):
        if 0 <= r < self.size and 0 <= c < self.size:
            return self.grid[r][c]
        return None
    
    def get_all_cells(self):
        for r in range(self.size):
            for c in range(self.size):
                yield self.grid[r][c]