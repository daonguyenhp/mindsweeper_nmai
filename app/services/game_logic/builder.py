import random
from app.models.board_model import Board

class BoardBuilder:
    @staticmethod
    def build_board(size=9, mines=10, safe_pos=None):
        board = Board(size, mines)
        BoardBuilder._place_mines(board, safe_pos)
        BoardBuilder._calculate_numbers(board)
        return board

    @staticmethod
    def _place_mines(board, safe_pos):
        all_positions = [(r, c) for r in range(board.size) for c in range(board.size)]
        
        if safe_pos and safe_pos in all_positions:
            all_positions.remove(safe_pos)

        mine_count = min(board.total_mines, len(all_positions))
        mine_positions = random.sample(all_positions, mine_count)
        
        for r, c in mine_positions:
            board.grid[r][c].is_mine = True

    @staticmethod
    def _calculate_numbers(board):
        directions = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]
        for r in range(board.size):
            for c in range(board.size):
                cell = board.get_cell(r, c)
                if cell.is_mine: continue
                
                count = 0
                for dr, dc in directions:
                    n = board.get_cell(r + dr, c + dc)
                    if n and n.is_mine: count += 1
                cell.neighbor_mines = count