import time
from .ai_solver import AISolver
from .ai_rules import AIRules

class DFSSolver(AISolver):
    def __init__(self, game_engine):
        # Gọi __init__ của class cha (AISolver)
        super().__init__(game_engine)
        self.stack = []

    def solve(self):
        self.stack.clear()
        self.reported_cells.clear()
        
        start_time = time.time()
        steps_count = 0
        steps_history_list = []

        # Đồng bộ trạng thái ban đầu (những ô đã mở) vào reported_cells
        if self.engine.board:
            for r in range(self.board_size):
                for c in range(self.board_size):
                    if self.engine.board.get_cell(r, c).is_revealed:
                        self.reported_cells.add((r, c))

        # --- BƯỚC KHỞI ĐỘNG ---
        # Mở ô trung tâm nếu bàn cờ chưa mở ô nào
        if self.engine.state.revealed_count == 0:
            start_r, start_c = self.board_size // 2, self.board_size // 2

            steps_count += 1
            steps_history_list.append({"type": "OPEN", "r": start_r, "c": start_c})

            yield from self._action_open(start_r, start_c, "Khởi động: Mở ô trung tâm")

        # --- VÒNG LẶP CHÍNH ---
        while not self.engine.state.game_over and not self.engine.state.victory:
            found_move_in_scan = False

            # --- GIAI ĐOẠN 1: DFS SUY LUẬN (Xử lý ưu tiên Stack) ---
            while self.stack:
                curr_r, curr_c = self.stack.pop()
                
                yield {
                    "action": "POP",
                    "cell": {"r": curr_r, "c": curr_c},
                    "stack": self._get_stack_visual(),
                    "message": f"DFS: Lấy ({curr_r},{curr_c}) từ Stack."
                }
                
                # Bỏ qua nếu ô này đã đủ cờ xung quanh (đã giải quyết xong)
                if self._is_satisfied(curr_r, curr_c):
                    continue

                yield {
                    "action": "THINKING",
                    "cell": {"r": curr_r, "c": curr_c},
                    "message": "Đang phân tích..."
                }

                # Tách logic check luật 1 & 2 ra file riêng (ai_rules.py)
                mines, safes = AIRules.apply_basic_rules(self.engine.board, curr_r, curr_c)
                actions_taken = False

                # Thực thi cắm cờ mìn
                for m in mines:
                    steps_count += 1
                    steps_history_list.append({"type": "FLAG", "r": m.r, "c": m.c}) 
                    yield from self._action_flag(m.r, m.c, f"Luật 1: ({curr_r},{curr_c}) suy ra ({m.r},{m.c}) là Mìn")
                    actions_taken = True
                    
                # Thực thi mở ô an toàn
                for s in safes:
                    steps_count += 1 
                    steps_history_list.append({"type": "OPEN", "r": s.r, "c": s.c})
                    yield from self._action_open(s.r, s.c, f"Luật 2: ({curr_r},{curr_c}) suy ra ({s.r},{s.c}) an toàn")
                    actions_taken = True

                # Nếu có hành động mở/cắm cờ, push các ô lân cận vào lại Stack để check lại
                if actions_taken:
                    for n in self._get_neighbors(curr_r, curr_c):
                        if n.is_revealed and not self._is_satisfied(n.r, n.c) and (n.r, n.c) not in self.stack:
                            self.stack.append((n.r, n.c))
                            yield {
                                "action": "PUSH",
                                "cell": {"r": n.r, "c": n.c},
                                "stack": self._get_stack_visual(),
                                "message": "Thông tin lân cận thay đổi -> Push Stack"
                            }

            # --- GIAI ĐOẠN 2: QUÉT TOÀN BỘ ---
            # Nếu Stack rỗng (chưa thắng mà hết manh mối cục bộ), quét lại cả bàn cờ
            if not self.engine.state.victory:
                yield {"action": "LOG", "message": "Stack rỗng. Quét lại toàn bộ bàn cờ..."}
                
                for r in range(self.board_size):
                    for c in range(self.board_size):
                        cell = self.engine.board.get_cell(r, c)
                        
                        # Chỉ check những ô đã mở và chưa được giải quyết xong
                        if cell.is_revealed and not self._is_satisfied(r, c):
                            mines, safes = AIRules.apply_basic_rules(self.engine.board, r, c)
                            
                            if mines or safes:
                                # Tìm thấy manh mối -> push luôn ô này vào stack và ngắt Global Scan
                                # để vòng lặp chính quay lại Giai đoạn 1 (xử lý Stack)
                                self.stack.append((r, c))
                                found_move_in_scan = True
                                break 
                                
                    if found_move_in_scan:
                        break

            # --- GIAI ĐOẠN 3: ĐOÁN MÒ (Random Guess) ---
            # Nếu cả Stack rỗng VÀ Quét toàn bộ cũng không ra gì -> Bí đường, buộc phải đoán
            if not self.stack and not found_move_in_scan and not self.engine.state.victory and not self.engine.state.game_over:
                yield {"action": "LOG", "message": "Bí luồng! Không đủ dữ kiện, buộc phải đoán xác suất..."}
                steps_count += 1
                yield from self._make_random_guess()

        # --- BÁO CÁO TỔNG KẾT ---
        end_time = time.time()
        duration = round(end_time - start_time, 2)
        final_status = "VICTORY" if self.engine.state.victory else "DEFEAT"

        yield {
            "action": "SUMMARY",
            "data": {
                "result": final_status,
                "time": duration,
                "steps": steps_count,
                "opened": self.engine.state.revealed_count,
                "algo": "DFS Standard",
                "steps_history": steps_history_list
            }
        }

    def _get_stack_visual(self):
        return [f"({r},{c})" for r, c in self.stack[-10:]]