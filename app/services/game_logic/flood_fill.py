from collections import deque

def bfs_reveal(board, game_state, start_cell):
    if start_cell.is_revealed: return
    
    queue = deque([start_cell])
    start_cell.is_revealed = True
    game_state.revealed_count += 1
    
    directions = [(-1,-1), (-1,0), (-1,1), (0,-1), (0,1), (1,-1), (1,0), (1,1)]
    
    while queue:
        curr = queue.popleft()
        if curr.neighbor_mines == 0:
            for dr, dc in directions:
                n = board.get_cell(curr.r + dr, curr.c + dc)
                if n and not n.is_revealed and not n.is_flagged:
                    n.is_revealed = True
                    game_state.revealed_count += 1
                    queue.append(n)