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
        directions = [(-1,-1), (-1,0), (-1,1), (0,-1), (0,1), (1,-1), (1,0), (1,1)]
        
        # 1. Tìm tất cả các ô ĐÃ MỞ xung quanh ô (r, c) vừa được giả sử
        revealed_neighbors = []
        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            neighbor = engine.board.get_cell(nr, nc)
            if neighbor and neighbor.is_revealed:
                revealed_neighbors.append(neighbor)
                
        # Lấy sandbox an toàn
        sandbox = getattr(engine, 'sandbox', {}) or {}
                
        # 2. Duyệt qua từng ô đã mở đó để kiểm tra "vỡ logic"
        for rev_cell in revealed_neighbors:
            target_mines = rev_cell.neighbor_mines
            
            current_mines = 0
            unassigned_hidden = 0
            
            # Quét 8 ô xung quanh của cái ô đã mở này
            for dr, dc in directions:
                nnr, nnc = rev_cell.r + dr, rev_cell.c + dc
                n_cell = engine.board.get_cell(nnr, nnc)
                
                if not n_cell: continue
                
                # Nếu là mìn thật (đã cắm cờ)
                if n_cell.is_flagged:
                    current_mines += 1
                # Nếu là ô đang ẩn (chưa mở)
                elif not n_cell.is_revealed:
                    # Kiểm tra xem ô ẩn này có nằm trong giấy nháp (sandbox) không
                    if (nnr, nnc) in sandbox:
                        if sandbox[(nnr, nnc)] is True: # AI đang giả sử đây là Mìn
                            current_mines += 1
                        # Nếu là False (An toàn) thì không cộng vào current_mines
                    else:
                        # Ô ẩn này chưa được AI đụng tới trong đệ quy
                        unassigned_hidden += 1
                        
            # Kiểm tra Luật 1: Dư mìn
            if current_mines > target_mines:
                return False
                
            # Kiểm tra Luật 2: Thiếu mìn
            if current_mines + unassigned_hidden < target_mines:
                return False
                
        # Vượt qua mọi bài test -> Giả thuyết hiện tại hợp lệ
        return True