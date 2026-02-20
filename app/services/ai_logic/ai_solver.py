import random

class AISolver:
    def __init__(self, game_engine):
        self.engine = game_engine
        self.board_size = game_engine.size
        self.reported_cells = set() # Tránh gửi lại các ô đã loang màu

    def _get_neighbors(self, r, c):
        neighbors = []
        directions = [(-1,-1), (-1,0), (-1,1), (0,-1), (0,1), (1,-1), (1,0), (1,1)]
        for dr, dc in directions:
            cell = self.engine.board.get_cell(r + dr, c + dc)
            if cell: neighbors.append(cell)
        return neighbors

    def _is_satisfied(self, r, c):
        cell = self.engine.board.get_cell(r, c)
        if not cell.is_revealed: return True
        hidden = [n for n in self._get_neighbors(r, c) if not n.is_revealed and not n.is_flagged]
        return len(hidden) == 0

    def _action_open(self, r, c, reason=""):
        if self.engine.board and self.engine.board.get_cell(r, c).is_revealed: 
            return
        
        result = self.engine.process_click(r, c)
        if result['status'] == 'lose': 
            yield {"action": "GAMEOVER", "cell": {"r": r, "c": c}}
            return

        # Gom các ô vừa bị loang màu lại thành 1 BATCH
        batch_data = []
        for row in range(self.board_size):
            for col in range(self.board_size):
                cell = self.engine.board.get_cell(row, col)
                if cell.is_revealed and (row, col) not in self.reported_cells:
                    batch_data.append({"r": cell.r, "c": cell.c, "val": cell.neighbor_mines})
                    self.reported_cells.add((row, col))
        
        if batch_data:
            yield {"action": "OPEN_BATCH", "cells": batch_data, "message": reason}

    def _action_flag(self, r, c, reason=""):
        if self.engine.board.get_cell(r, c).is_flagged: return
        self.engine.process_flag(r, c)
        self.reported_cells.add((r, c))
        yield {"action": "FLAG", "cell": {"r": r, "c": c}, "message": reason}

    def _make_random_guess(self):
        candidates = [(r, c) for r in range(self.board_size) for c in range(self.board_size) 
                      if not self.engine.board.get_cell(r, c).is_revealed 
                      and not self.engine.board.get_cell(r, c).is_flagged]
        if candidates:
            r, c = random.choice(candidates)
            yield from self._action_open(r, c, "Đoán mò (Random Guess)")