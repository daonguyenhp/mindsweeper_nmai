from app.models.state_model import GameState
from .builder import BoardBuilder
from .flood_fill import bfs_reveal

class GameEngine:
    def __init__(self, size, mines):
        self.size = size
        self.mines = mines
        self.board = None
        self.state = GameState(size, mines)

        self.sandbox = None

    def process_click(self, r, c):
        # Lazy load: Click lần đầu mới tạo map
        if self.state.is_first_move:
            self.board = BoardBuilder.build_board(self.size, self.mines, safe_pos=(r, c))
            self.state.is_first_move = False

        cell = self.board.get_cell(r, c)
        if not cell or self.state.game_over or self.state.win: 
            return {"status": "ignored"}
        if cell.is_revealed or cell.is_flagged: 
            return {"status": "ignored"}

        # Thua
        if cell.is_mine:
            self.state.game_over = True
            cell.is_revealed = True
            return {"status": "lose", "cell": cell.to_dict(show_hidden=True)}

        # Loang màu
        bfs_reveal(self.board, self.state, cell)

        # Thắng - Check 1: All safe cells revealed
        if self.state.revealed_count == self.state.safe_cells_total:
            self.state.win = True
            return {"status": "win"}
        
        # Thắng - Check 2: All mines flagged + all safe cells revealed (with flagged count)
        if self.state.flagged_count == self.state.total_mines and self.state.revealed_count == self.state.safe_cells_total:
            self.state.win = True
            return {"status": "win"}

        return {"status": "continue"}

    def process_flag(self, r, c):
        if self.state.is_first_move: return {"status": "ignored"}
        cell = self.board.get_cell(r, c)
        if not cell or self.state.game_over or self.state.win or cell.is_revealed:
            return {"status": "ignored"}
        
        # Toggle flag and track count
        previous_flagged = cell.is_flagged
        cell.is_flagged = not cell.is_flagged
        
        # Update flagged count
        if cell.is_flagged and not previous_flagged:
            self.state.flagged_count += 1
            self.state.remaining_mines = max(0, self.state.remaining_mines - 1)
        elif not cell.is_flagged and previous_flagged:
            self.state.flagged_count -= 1
            self.state.remaining_mines = min(self.state.total_mines, self.state.remaining_mines + 1)
        
        # Check instant win: all mines flagged AND all safe cells revealed
        if self.state.flagged_count == self.state.total_mines and self.state.revealed_count == self.state.safe_cells_total:
            self.state.win = True
        
        return {
            "status": "flagged",
            "state": cell.is_flagged,
            "r": r,
            "c": c,
            "remaining_mines": self.state.remaining_mines,
        }
    
    # =========================================================================
    # TODO [@CHI TRANG]
    # =========================================================================
    # MỤC TIÊU:
    # Tạo ra một "tờ giấy nháp" để AI có thể thử cắm mìn ảo trong lúc 
    # chạy đệ quy DFS mà không làm hỏng dữ liệu của bàn cờ thật.
    #
    # LƯU Ý BẮT BUỘC: 
    # - Tuyệt đối không dùng `copy.deepcopy(self.board)` vì sẽ tràn RAM và cực lag.
    # - Chỉ dùng 1 Dictionary (dict) để lưu tọa độ đang bị giả sử.
    #   Ví dụ: self.sandbox = {(0,1): True, (0,2): False} (True: mìn, False: an toàn).
    # =========================================================================
    
    def create_sandbox(self):
        """Khởi tạo sandbox là một dict rỗng khi AI bắt đầu đệ quy."""
        self.sandbox = {}
        pass

    def rollback_sandbox(self):
        """Hủy hoàn toàn sandbox sau khi đệ quy xong để dọn dẹp RAM."""
        self.sandbox = None
        pass
        