class AIService:
    def __init__(self, socketio):
        self.socketio = socketio

    def start_solving_background(self, sid, engine, algo_type='dfs'):
        self.socketio.start_background_task(
            target=self._solve_loop,
            sid=sid,
            engine=engine,
            algo_type=algo_type
        )

    def _solve_loop(self, sid, engine, algo_type):
        engine.ai_running = True

        # 1. Chọn Solver tương ứng
        from app.services.ai_logic.dfs_solver import DFSSolver
        
        if algo_type == 'dfs':
            solver = DFSSolver(engine)
        elif algo_type == 'prob':
            # Ví dụ sau này có: solver = ProbSolver(engine)
            solver = DFSSolver(engine)
        else:
            solver = DFSSolver(engine)

        # 2. Chạy vòng lặp giải thuật
        for step in solver.solve():
            # Kiểm tra cờ dừng (nếu người dùng gọi lệnh stop_ai bên kia)
            if not engine.ai_running:
                self.socketio.emit('ai_update', {'action': 'LOG', 'message': '⛔ AI STOPPED BY USER.'}, room=sid)
                break

            # Gửi từng bước về cho client cụ thể (dùng room=sid)
            self.socketio.emit('ai_update', step, room=sid)
            
            # 3. Điều chỉnh tốc độ (Delay)
            # Lưu ý dùng self.socketio.sleep() thay vì time.sleep() để không block Flask
            if step['action'] == 'THINKING':
                self.socketio.sleep(0.1)
            elif step['action'] == 'OPEN_BATCH': 
                self.socketio.sleep(0.5)
            elif step['action'] == 'OPEN':       
                self.socketio.sleep(0.1)
            elif step['action'] == 'FLAG':
                self.socketio.sleep(0.2)
            elif step['action'] == 'POP':        
                self.socketio.sleep(0.05)
            elif step['action'] == 'LOG':
                self.socketio.sleep(0.5)
            elif step['action'] == 'SUMMARY':    
                self.socketio.sleep(0)
                
        # Kết thúc vòng lặp
        engine.ai_running = False