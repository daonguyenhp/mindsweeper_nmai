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
    godModeCache = gridData;
    
    const isGodModeOn = document.getElementById('cheat-toggle').checked;
    
    if (!isGodModeOn) return;
    const miniContainer = document.getElementById('mini-map-container');
    if (!miniContainer) return;

    if (!gridData || gridData.length === 0) {
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

    const size = gridData.length;
    miniContainer.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

    const existingCells = miniContainer.querySelectorAll('.mini-cell');
    
    if (existingCells.length === size * size) {
        let idx = 0;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = gridData[r][c];
                existingCells[idx].className = 'mini-cell ' + (cell.is_mine ? 'mine' : 'safe');
                idx++;
            }
        }
    } else {
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