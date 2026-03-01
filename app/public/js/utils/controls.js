function startGame() {
    const difficultySelect = document.getElementById('difficulty');
    const mode = difficultySelect.value;
    const config = LEVELS[mode];
    
    currentBoardSize = config.size;
    aiHistory = [];
    currentStepIndex = -1;
    godModeCache = [];
    
    resetUI();

    document.getElementById('cheat-toggle').checked = false;
    document.body.style.borderTop = "none";
    
    if (typeof setMinimapFocus === 'function') {
        setMinimapFocus(false);
    }

    socket.emit('start_game', config);
    socket.emit('cheat_reveal'); 

    const dropdown = document.getElementById('god-mode-dropdown');
    if (dropdown) dropdown.classList.remove('active');
}

function fetchAndRunAI() {
    const algoType = document.getElementById('ai-algo').value;
    
    aiHistory = [];
    currentStepIndex = -1;
    
    addLog('system', `INITIALIZING AI KERNEL [${algoType.toUpperCase()}]...`);
    
    startTimer();
    
    document.getElementById('btn-run').disabled = true;
    document.getElementById('btn-stop').disabled = false;

    // Gửi lệnh chạy AI
    socket.emit('run_ai', { algo: algoType });
}

function stopAI() {
    socket.emit('stop_ai');
    
    // Pause the timer
    pauseTimer();
    
    // Mở lại nút Run
    document.getElementById('btn-run').disabled = false;
    document.getElementById('btn-stop').disabled = true;
    
    addLog('system', 'SENDING MANUAL STOP SIGNAL...');
}

function toggleGodMode() {
    const isChecked = document.getElementById('cheat-toggle').checked;
    
    // 1. Tác động vào khối Dropdown để nó thả xuống / cuộn lên
    const dropdown = document.getElementById('god-mode-dropdown');
    if (dropdown) {
        if (isChecked) {
            dropdown.classList.add('active'); // Thả xuống
        } else {
            dropdown.classList.remove('active'); // Cuộn lên giấu đi
        }
    }
    
    // 2. Viền màn hình & Log
    document.body.style.borderTop = isChecked ? "3px solid #f1c40f" : "none";
    addLog('system', isChecked ? 'GOD MODE: ENABLED' : 'GOD MODE: DISABLED');
    
    // 3. Gửi lệnh lên Server
    socket.emit('cheat_reveal', { enable: isChecked });
}

// --- XỬ LÝ CLICK TRÊN BÀN CỜ ---
function handleClick(r, c, action) {
    // Nếu đang xem lại Replay (Playback) thì không cho click lung tung
    if (aiHistory.length > 0 && currentStepIndex !== -1 && currentStepIndex < aiHistory.length - 1) {
        return; 
    }
    
    // Gửi tọa độ click lên Server xử lý
    // action: 'left' (mở ô) hoặc 'right' (cắm cờ)
    socket.emit('click_cell', { r, c, action });
}

// --- XỬ LÝ PHÍM TẮT (KEYBOARD) ---
document.addEventListener('keydown', (e) => {
    // Chỉ hoạt động khi có lịch sử AI để tua lại
    if (aiHistory.length === 0) return;

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        // Tua tới 1 bước
        if (currentStepIndex < aiHistory.length - 1) {
            renderState(currentStepIndex + 1);
        }
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        // Tua lui 1 bước
        if (currentStepIndex > 0) {
            renderState(currentStepIndex - 1);
        }
    }
});