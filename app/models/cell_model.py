class Cell:
    def __init__(self, r, c):
        self.r = r
        self.c = c
        self.is_mine = False
        self.is_revealed = False
        self.is_flagged = False
        self.neighbor_mines = 0
    
    def to_dict(self, show_hidden=False):

        data = {
            "r": self.r,
            "c": self.c,
            "is_revealed": self.is_revealed,
            "is_flagged": self.is_flagged,
            "neighbor_mines": self.neighbor_mines
        }

        if self.is_revealed or show_hidden:
            data["is_mine"] = self.is_mine
        
        return data
