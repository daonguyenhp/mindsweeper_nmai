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

    # =========================================================================
    # TODO [@ANH DAC NGHIA]
    # =========================================================================
    # MỤC TIÊU (Tiền xử lý):
    # Hàm này chạy TRƯỚC khi đệ quy. 
    # Tránh việc DFS phải duyệt toàn bộ bàn cờ. Dùng DFS quét tìm các ô 
    # CHƯA MỞ nằm sát các ô ĐÃ MỞ (Fringe Cells).
    # Sau đó tìm Thành phần liên thông (Connected Components) để chia Fringe 
    # thành nhiều list nhỏ (các cụm độc lập).
    #
    # INPUT: Không có tham số truyền vào (Dùng self.engine.board).
    #
    # OUTPUT: list of lists.
    #   Ví dụ: [ [(0,1), (0,2)], [(8,8), (8,7), (7,8)] ]
    # =========================================================================
    def _get_fringe_components(self):
        """
        Trả về: list of lists.
        Ví dụ: [ [(0,1), (0,2)], [(8,8), (8,7), (7,8)] ]
        """
        fringe_components = []
        # TODO: Your code here
        
        return fringe_components
    
    # =========================================================================
    # TODO [@ANH DAC NGHIA] - TÍNH TOÁN XÁC SUẤT 
    # =========================================================================
    # MỤC TIÊU (Hậu xử lý):
    # Hàm này chạy SAU khi đệ quy xong.
    # Nhiệm vụ: Tính xác suất có mìn cho từng ô dựa trên các kịch bản hợp lệ. 
    # Ví dụ: Ô A là mìn trong 0/5 cách -> An toàn 100%. Ô B là mìn 4/5 cách -> 80% có mìn.
    #
    # INPUT: 
    # - valid_configurations (list of lists): Một list các cấu hình hợp lệ 
    #   (ví dụ đệ quy tìm ra 5 cách xếp mìn thỏa mãn).
    #
    # OUTPUT: 
    # - tuple (r, c): Tọa độ ô an toàn nhất để AI quyết định click. 
    #   Nếu không có ô an toàn 100%, trả về None.
    # =========================================================================
    def _calculate_safest_cell(self, valid_configurations):
        """
        Trả về: Tọa độ (r, c) của ô an toàn nhất để AI quyết định click.
        """
        safest_cell = None
        # TODO: Your code here
        
        return safest_cell
    
    # =========================================================================
    # TODO [@ANH DAC NGHIA] - DỰ ĐOÁN
    # =========================================================================
    # MỤC TIÊU (Dự đoán):
    # Khi đệ quy DFS bó tay (không có ô nào an toàn 100%), AI bắt buộc phải đoán.
    # Dùng dữ liệu từ _calculate_safest_cell để đưa ra quyết định ô có rủi ro THẤP NHẤT.
    # Nếu Fringe rỗng (đầu game), tính Global Probability và ưu tiên bấm 4 góc.
    #
    # INPUT: 
    # - valid_configurations (list of lists, default=None).
    #
    # OUTPUT: Gọi lệnh yield _action_open để thực hiện mở ô.
    # =========================================================================
    def _make_smart_guess(self, valid_configurations=None):
        """
        Dùng dữ liệu từ _calculate_safest_cell để đưa ra quyết định.
        Nếu Fringe rỗng (đầu game), tính Global Probability và ưu tiên bấm 4 góc.
        """
        best_r, best_c = None, None
        
        # TODO: Your code here
        yield {"action": "LOG", "message": "Đang tính toán rủi ro để đưa ra quyết định..."}
        
        if best_r is not None and best_c is not None:
            yield from self._action_open(best_r, best_c, "Đoán thông minh dựa trên xác suất")
        else:
            yield from self._make_random_guess()

            
    # INPUT: 
    # 
    #
    # OUTPUT: Trả về True nếu đúng số mìn còn lại, các trường hợp khác trả về False
    # =========================================================================
    def is_sandbox_valid(self, r, c, assignment):

        for neighbor in self._get_neighbors(r, c):
            if not neighbor.is_revealed:
                continue
    
            required = neighbor.neighbor_mines
            assigned_mines = 0
            unassigned = 0
    
            for n2 in self._get_neighbors(neighbor.r, neighbor.c):
                pos = (n2.r, n2.c)
                if pos in assignment:
                    if assignment[pos]:
                        assigned_mines += 1
                elif not n2.is_revealed:
                    unassigned += 1

            if assigned_mines > required:
                return False
    
            if assigned_mines + unassigned < required:
                return False
    
        return True
