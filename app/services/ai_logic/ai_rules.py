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
    

    # =========================================================================
    # TODO [@TRAN KHANH TAM]
    # =========================================================================
    # MỤC TIÊU:
    # Đây là bộ lọc "Cắt tỉa nhánh" (Pruning) cho hàm đệ quy Ở GIAI ĐOẠN 3.
    # Khi AI giả sử 1 ô là Mìn/An toàn trong Sandbox, hàm này sẽ quét xem 
    # cái giả sử đó có làm "vỡ logic" của các con số xung quanh hay không.
    #
    # INPUT:
    # - engine: Đối tượng chứa bàn cờ thật và cả Sandbox (giấy nháp mìn ảo).
    # - r, c: Tọa độ của ô VỪA ĐƯỢC GIẢ SỬ.
    #
    # OUTPUT:
    # - bool: Trả về True nếu giả thuyết vẫn hợp lệ, False nếu sai luật.
    #
    # LƯU Ý / THUẬT TOÁN ĐỀ XUẤT:
    # Tìm tất cả các ô ĐÃ MỞ xung quanh ô (r, c). Với MỖI ô mở đó, kiểm tra:
    # 1. [Luật Dư Mìn]: Tổng số mìn thật + mìn ảo trong Sandbox > con số trên ô -> False!
    # 2. [Luật Thiếu Mìn]: (Tổng mìn thật + mìn ảo) + số ô ẩn CHƯA xét < con số trên ô 
    #    -> False! (Vì dù có nhét mìn vào hết các ô ẩn còn lại cũng ko đủ quota).
    # - Vượt qua hết các ô xung quanh mà không vi phạm -> Return True.
    # =========================================================================
    @staticmethod
    def is_sandbox_valid(engine, r, c):
        # TODO: Your code here
        return True