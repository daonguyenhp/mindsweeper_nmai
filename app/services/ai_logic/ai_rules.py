class AIRules:
    @staticmethod
    def apply_basic_rules(board, r, c):
        cell = board.get_cell(r, c)
        if not cell or not cell.is_revealed: return [], []

        directions = [(-1,-1), (-1,0), (-1,1), (0,-1), (0,1), (1,-1), (1,0), (1,1)]
        hidden = []
        flagged_count = 0

        for dr, dc in directions:
            n = board.get_cell(r + dr, c + dc)
            if n:
                if n.is_flagged: flagged_count += 1
                elif not n.is_revealed: hidden.append(n)

        val = cell.neighbor_mines
        
        # Rule 1: Mìn = Ẩn + Cờ -> Ẩn là Mìn
        if len(hidden) > 0 and val == len(hidden) + flagged_count:
            return hidden, []
            
        # Rule 2: Mìn = Cờ -> Ẩn là An toàn
        elif len(hidden) > 0 and val == flagged_count:
            return [], hidden
            
        return [], []