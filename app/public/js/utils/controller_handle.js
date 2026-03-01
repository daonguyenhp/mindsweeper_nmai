socket.on('init_board', (data) => {
    drawBoard(data.size);
    document.getElementById('mines-count').innerText = data.mines;
    addLog('system', `Map generated: ${data.size}x${data.size}`);
});

socket.on('full_board_update', (gridData) => {
    for (let r = 0; r < gridData.length; r++) {
        for (let c = 0; c < gridData[r].length; c++) {
            updateCellVisual(gridData[r][c]);
        }
    }
    // Lấy lại minimap sau khi đã tạo first-click an toàn
    socket.emit('cheat_reveal'); 
});

socket.on('ai_update', (stepData) => {
    aiHistory.push(stepData);
    const newIndex = aiHistory.length - 1;

    if (stepData.action === "SUMMARY") {
        showSummaryModal(stepData.data);
        document.getElementById('btn-run').disabled = false;
        document.getElementById('btn-stop').disabled = true;
    }

    if (stepData.message && stepData.message.trim() !== "") {
        addLog(stepData.action, stepData.message, true, newIndex);
    }

    if (document.getElementById('cheat-toggle').checked) {
        socket.emit('cheat_reveal', { enable: true });
    }
    
    renderState(newIndex);
});

socket.on('update_board', (data) => {
    if (data.status === 'lose') {
        stopTimer();
        revealAllMines(data.cell);
        addLog('system', 'CRITICAL FAILURE: MINE DETONATED');
    } else if (data.status === 'win') {
        stopTimer();
        addLog('system', 'MISSION ACCOMPLISHED');
    }
});

socket.on('minimap_data', (gridData) => {
    // 1. Luôn luôn lưu dữ liệu mới nhất vào kho
    godModeCache = gridData;
    
    // 2. Kiểm tra xem God Mode có đang BẬT không?
    const isGodModeOn = document.getElementById('cheat-toggle').checked;
    
    // Nếu God Mode đang TẮT thì thôi, không cần vẽ cho đỡ nặng máy
    if (!isGodModeOn) return;

    // 3. Nếu God Mode đang BẬT -> TIẾN HÀNH VẼ NGAY LẬP TỨC
    const miniContainer = document.getElementById('mini-map-container');
    if (!miniContainer) return;

    // Xử lý trường hợp chưa có mìn (Mới vào game) -> Vẽ xanh hết
    if (!gridData || gridData.length === 0) {
        // Lấy kích thước bàn cờ (mặc định 10 nếu chưa có)
        const size = typeof currentBoardSize !== 'undefined' ? currentBoardSize : 10;
        miniContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        miniContainer.innerHTML = '';
        
        for (let i = 0; i < size * size; i++) {
            const div = document.createElement('div');
            div.className = 'mini-cell safe';
            miniContainer.appendChild(div);
        }
        return;
    }

    // Xử lý trường hợp ĐÃ CÓ MÌN (Sau khi click ô đầu tiên)
    const size = gridData.length;
    miniContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

    // Kỹ thuật "Diffing" nhẹ: Kiểm tra xem lưới đã vẽ chưa
    const existingCells = miniContainer.querySelectorAll('.mini-cell');
    
    if (existingCells.length === size * size) {
        // Lưới đã có sẵn -> Chỉ cần cập nhật màu (Mìn/An toàn)
        // Cách này cực nhanh, không bị nháy hình
        let idx = 0;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = gridData[r][c];
                // Cập nhật class: Nếu là mìn thì 'mine', không thì 'safe'
                existingCells[idx].className = 'mini-cell ' + (cell.is_mine ? 'mine' : 'safe');
                idx++;
            }
        }
    } else {
        // Lưới chưa có hoặc sai kích thước -> Vẽ mới hoàn toàn
        miniContainer.innerHTML = ''; 
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const div = document.createElement('div');
                div.className = 'mini-cell ' + (gridData[r][c].is_mine ? 'mine' : 'safe');
                miniContainer.appendChild(div);
            }
        }
    }
});