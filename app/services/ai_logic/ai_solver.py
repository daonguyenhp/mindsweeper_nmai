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
        # TODO: Your code here
        fringe_cells = set()
        
        # BƯỚC 1: Tìm tất cả các ô Fringe
        for r in range(self.board_size):
            for c in range(self.board_size):
                cell = self.engine.board.get_cell(r, c)
                # Ô Fringe là ô CHƯA MỞ, CHƯA CẮM CỜ
                if not cell.is_revealed and not cell.is_flagged:
                    neighbors = self._get_neighbors(r, c)
                    # Và có ít nhất 1 ô lân cận ĐÃ MỞ
                    if any(n.is_revealed for n in neighbors):
                        fringe_cells.add((r, c))
                        
        # BƯỚC 2: Map mỗi ô Fringe với tập hợp các ô lân cận ĐÃ MỞ của nó
        fringe_to_revealed = {}
        for fr, fc in fringe_cells:
            revealed_neighbors = set(
                (n.r, n.c) for n in self._get_neighbors(fr, fc) if n.is_revealed
            )
            fringe_to_revealed[(fr, fc)] = revealed_neighbors
            
        # BƯỚC 3: Gom cụm (Connected Components) bằng BFS
        visited = set()
        components = []
        
        for cell in fringe_cells:
            if cell not in visited:
                queue = [cell]
                visited.add(cell)
                current_component = []
                
                while queue:
                    curr = queue.pop(0)
                    current_component.append(curr)
                    
                    for other_cell in fringe_cells:
                        if other_cell not in visited:
                            # LOGIC CỐT LÕI: 2 ô Fringe thuộc cùng 1 cụm nếu 
                            # chúng có CHUNG ít nhất 1 ô lân cận đã mở
                            if not fringe_to_revealed[curr].isdisjoint(fringe_to_revealed[other_cell]):
                                visited.add(other_cell)
                                queue.append(other_cell)
                                
                components.append(current_component)
                
        return components
    
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
        if not valid_configurations:
            return None
            
        mine_counts = {}
        total_configs = len(valid_configurations)
        for config in valid_configurations:
            for cell, is_mine in config.items():
                mine_counts[cell] = mine_counts.get(cell, 0) + (1 if is_mine else 0)
                
        min_prob = 1.0 
        
        for cell, count in mine_counts.items():
            prob = count / total_configs
            if prob < min_prob:
                min_prob = prob
                safest_cell = cell
                
        # Theo đúng yêu cầu: Chỉ trả về tọa độ nếu an toàn 100% (xác suất mìn = 0.0)
        if min_prob == 0.0:
            return safest_cell
            
        return None
    
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
        best_r, best_c = None, None
        min_prob = 1.0
        
        if valid_configurations:
            mine_counts = {}
            total_configs = len(valid_configurations)
            for config in valid_configurations:
                for cell, is_mine in config.items():
                    mine_counts[cell] = mine_counts.get(cell, 0) + (1 if is_mine else 0)
            
            for cell, count in mine_counts.items():
                prob = count / total_configs
                if prob < min_prob:
                    min_prob = prob
                    best_r, best_c = cell
                    
            message = f"Đoán thông minh (Rủi ro mìn: {min_prob*100:.1f}%)"
            
        else:
            corners = [
                (0, 0), (0, self.board_size-1), 
                (self.board_size-1, 0), (self.board_size-1, self.board_size-1)
            ]
            valid_corners = [
                (r, c) for r, c in corners 
                if not self.engine.board.get_cell(r, c).is_revealed 
                and not self.engine.board.get_cell(r, c).is_flagged
            ]
            
            if valid_corners:
                best_r, best_c = random.choice(valid_corners)
                message = "Đoán chiến thuật (Mở góc bàn cờ)"
            else:
                yield from self._make_random_guess()
                return
            
        yield {"action": "LOG", "message": "Đang tính toán rủi ro để đưa ra quyết định..."}
        
        if best_r is not None and best_c is not None:
            yield from self._action_open(best_r, best_c, "Đoán thông minh dựa trên xác suất")
        else:
            yield from self._make_random_guess()