let currentStepsHistory = []; 
let isBoardPristine = true;
let totalMines = 0;
let flaggedCellsCount = 0;
let openedCellsCount = 0;

let gameTimer = null;
let timerStartTime = 0;
let timerElapsedTime = 0;
let timerPaused = false;
let gameEnded = false;

function setTotalMines(count) {
    totalMines = Number.isFinite(count) ? count : 0;
    updateMineCounter();
}

function updateMineCounter() {
    const remaining = Math.max(0, totalMines - flaggedCellsCount);
    const minesEl = document.getElementById('mines-count');
    if (minesEl) {
        minesEl.innerText = String(remaining).padStart(2, '0');
    }
}

function syncBoardStats(gridData) {
    if (!Array.isArray(gridData) || gridData.length === 0) return;

    let flagged = 0;
    let opened = 0;

    for (const row of gridData) {
        for (const cell of row) {
            if (cell.is_flagged) flagged++;
            if (cell.is_revealed && !cell.is_mine) opened++;
        }
    }

    flaggedCellsCount = flagged;
    openedCellsCount = opened;
    updateMineCounter();

    const openedEl = document.getElementById('report-opened');
    if (openedEl) {
        openedEl.innerText = String(openedCellsCount);
    }
}

function startTimer() {
    if (gameEnded) return;
    
    if (gameTimer) {
        clearInterval(gameTimer);
    }
    
    if (timerPaused) {
        timerStartTime = Date.now() - (timerElapsedTime * 1000);
        timerPaused = false;
    } else {
        timerElapsedTime = 0;
        timerStartTime = Date.now();
    }
    
    gameTimer = setInterval(updateTimerDisplay, 100);
}

function pauseTimer() {
    if (gameTimer && !timerPaused) {
        clearInterval(gameTimer);
        timerPaused = true;
        timerElapsedTime = (Date.now() - timerStartTime) / 1000;
    }
}

function stopTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
        timerElapsedTime = (Date.now() - timerStartTime) / 1000;
    }
    timerPaused = false;
    gameEnded = true;
    updateTimerDisplay();
}

function resetTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    timerStartTime = 0;
    timerElapsedTime = 0;
    timerPaused = false;
    gameEnded = false;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    // Only update elapsed time if timer is running (not paused, not ended)
    if (!timerPaused && !gameEnded && gameTimer) {
        timerElapsedTime = (Date.now() - timerStartTime) / 1000;
    }
    
    const timeStr = timerElapsedTime.toFixed(1);
    const timeStrInt = Math.floor(timerElapsedTime).toString().padStart(3, '0');
    
    // Update header timer
    const headerTimer = document.getElementById('timer');
    if (headerTimer) {
        headerTimer.innerText = timeStrInt;
    }
    
    // Update dashboard timer
    const dashboardTimer = document.getElementById('report-time');
    if (dashboardTimer) {
        dashboardTimer.innerText = timeStr + 's';
    }
}

function resetUI() {
    document.getElementById('ai-log').innerHTML = '<div class="log-entry system">> System Ready.</div>';
    document.getElementById('stack-container').innerHTML = '<div class="stack-placeholder">Stack Empty</div>';
    document.getElementById('stack-depth').innerText = '0';
    totalMines = 0;
    flaggedCellsCount = 0;
    openedCellsCount = 0;
    updateMineCounter();
    
    // Reset Dashboard Mini
    document.getElementById('report-algo').innerText = "---";
    document.getElementById('report-result').innerText = "---";
    document.getElementById('report-result').style.color = "white";
    document.getElementById('report-time').innerText = "0.0s";
    document.getElementById('report-steps').innerText = "0";
    document.getElementById('report-opened').innerText = "0";
    currentStepsHistory = [];

    // Reset timer
    resetTimer();

    isBoardPristine = true;
}

function drawBoard(size) {
    // Show board wrapper when drawing board
    const boardWrapper = document.querySelector('.board-wrapper');
    if (boardWrapper) {
        boardWrapper.classList.add('visible');
    }
    
    // Dynamic cell sizing based on board size
    let cellSize;
    if (size <= 5) {
        cellSize = 40; // Big cells for tiny boards
    } else if (size <= 9) {
        cellSize = 34; // Medium cells for normal boards
    } else if (size <= 16) {
        cellSize = 26; // Small cells for larger boards
    } else {
        cellSize = 20; // Extra small for huge boards
    }
    
    // Adjust for mobile screens
    const viewportWidth = window.innerWidth;
    if (viewportWidth <= 480) {
        cellSize = Math.min(cellSize, 22); // Cap at 22px on mobile
    } else if (viewportWidth <= 768) {
        cellSize = Math.min(cellSize, 28); // Cap at 28px on tablet
    }
    
    document.documentElement.style.setProperty('--cell-size', `${cellSize}px`);
    
    const colCoords = document.getElementById('col-coords');
    const rowCoords = document.getElementById('row-coords');
    const board = document.getElementById('game-board');
    
    const gridStyle = `repeat(${size}, 1fr)`;
    colCoords.style.gridTemplateColumns = gridStyle; colCoords.innerHTML = '';
    rowCoords.style.gridTemplateRows = gridStyle;    rowCoords.innerHTML = '';
    board.style.gridTemplateColumns = gridStyle;     board.innerHTML = '';

    for(let i=0; i<size; i++) colCoords.innerHTML += `<div class="coord-label col">${i}</div>`;
    for(let i=0; i<size; i++) rowCoords.innerHTML += `<div class="coord-label row">${i}</div>`;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${r}-${c}`;
            cell.setAttribute('data-hide', 'true');
            cell.onclick = () => handleClick(r, c, 'left');
            cell.oncontextmenu = (e) => { e.preventDefault(); handleClick(r, c, 'right'); };
            board.appendChild(cell);
        }
    }
}

function updateCellVisual(cellData) {
     const cellDiv = document.getElementById(`cell-${cellData.r}-${cellData.c}`);
     if (!cellDiv) return;
     
    cellDiv.className = 'cell';

     // KHI Ô NÀY ĐƯỢC LẬT MỞ (Do user click hoặc AI click)
     if (cellData.is_revealed) {
         cellDiv.setAttribute('data-hide', 'false');
         
         // 🚨 TUYỆT CHIÊU BẮT SỰ KIỆN FIRST CLICK TẠI ĐÂY 🚨
         if (isBoardPristine) {
            isBoardPristine = false;
             
             // Kiểm tra xem God Mode có đang được bật không?
             const isGodModeOn = document.getElementById('cheat-toggle').checked;
             if (isGodModeOn) {
                 // Ép Server phải gửi ngay lập tức bản đồ mìn mới nhất về!
                 socket.emit('cheat_reveal', { enable: true });
                 console.log("[GOD MODE] Đã ép server cập nhật Minimap sau First Click!");
             }
         }
         // 🚨 KẾT THÚC TUYỆT CHIÊU 🚨

         cellDiv.classList.add('revealed');
         
         if (cellData.is_mine) {
             cellDiv.classList.add('mine');
             cellDiv.innerHTML = '<i class="fas fa-bomb"></i>';
         } else if (cellData.neighbor_mines > 0) {
             cellDiv.innerText = cellData.neighbor_mines;
             cellDiv.setAttribute('data-val', cellData.neighbor_mines);
         } else {
            cellDiv.innerText = ''; 
            cellDiv.removeAttribute('data-val');
        }
     } else if (cellData.is_flagged) {
         cellDiv.setAttribute('data-hide', 'true');
         cellDiv.classList.add('flag');
         cellDiv.innerHTML = '<i class="fas fa-flag"></i>';
     } else {
         cellDiv.setAttribute('data-hide', 'true');
         cellDiv.innerHTML = '';
     }
}

function addLog(type, msg, autoScroll = true, stepIndex = null) {
    const container = document.getElementById('ai-log');
    const div = document.createElement('div');
    const time = new Date().toLocaleTimeString('vi-VN', {hour12: false});
    
    // Chuẩn hóa type thành chữ hoa để khớp CSS
    const upperType = type.toUpperCase();
    div.className = `log-entry ${upperType}`;
    
    if (stepIndex !== null) {
        div.id = `log-step-${stepIndex}`;
        div.style.cursor = "pointer";
        div.title = "Click to jump to this step";
        div.setAttribute('data-step-index', stepIndex);
        div.setAttribute('data-has-snapshot', 'true');
        
        // Create snapshot icon as separate clickable element
        const snapshotIcon = document.createElement('span');
        snapshotIcon.innerHTML = '📷';
        snapshotIcon.style.opacity = '0.4';
        snapshotIcon.style.fontSize = '0.75em';
        snapshotIcon.style.marginLeft = '5px';
        snapshotIcon.style.cursor = 'pointer';
        snapshotIcon.title = 'View snapshot details';
        snapshotIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent log jump
            showSnapshotViewer(stepIndex);
        });
        
        div.innerHTML = `<span style="opacity:0.5; font-size:0.8em">[#${stepIndex}]</span> ${msg} `;
        div.appendChild(snapshotIcon);
        
        // Click on log entry jumps to that step
        div.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof renderState === 'function') {
                renderState(stepIndex);
            }
        });
        
        // Add hover effect
        div.addEventListener('mouseover', () => {
            div.style.backgroundColor = 'rgba(189, 147, 249, 0.1)';
            div.style.borderLeft = '3px solid var(--accent-primary)';
        });
        div.addEventListener('mouseout', () => {
            div.style.backgroundColor = '';
            div.style.borderLeft = '';
        });
    } else {
        div.innerHTML = `<span style="opacity:0.5">[${time}]</span> ${msg}`;
    }
    
    container.appendChild(div);
    if (autoScroll) container.scrollTop = container.scrollHeight;
}

function updateStack(stackItems) {
    const container = document.getElementById('stack-container');
    container.innerHTML = '';
    stackItems.slice(-12).forEach(item => {
        const div = document.createElement('div');
        div.className = 'stack-item';
        div.innerText = item;
        container.appendChild(div);
    });
}

function revealAllMines(triggerCell) {
    const triggerDiv = document.getElementById(`cell-${triggerCell.r}-${triggerCell.c}`);
    if (triggerDiv) {
        triggerDiv.classList.add('mine');
        triggerDiv.innerHTML = '<i class="fas fa-bomb"></i>';
        triggerDiv.style.backgroundColor = '#ff5555';
    }
}

// Cập nhật Dashboard Mini và chuẩn bị dữ liệu Steps
function showSummaryModal(data) {
    // Stop the timer when summary is shown
    stopTimer();
    
    document.getElementById('report-algo').innerText = data.algo;
    document.getElementById('report-result').innerText = data.result;
    
    const resultEl = document.getElementById('report-result');
    resultEl.style.color = data.result === "VICTORY" ? "var(--accent-success)" : "var(--accent-danger)";
    
    // Use server time if available, otherwise use our timer
    const finalTime = data.time || timerElapsedTime.toFixed(1);
    document.getElementById('report-time').innerText = finalTime + "s";
    document.getElementById('report-steps').innerText = data.steps;
    document.getElementById('report-opened').innerText = data.opened;

    // Lưu lại lịch sử các bước để khi bấm vào con số steps sẽ hiện ra
    let sourceData = data.steps_history;
    
    if (!sourceData || sourceData.length === 0) {
        // Kiểm tra xem biến aiHistory có tồn tại và có dữ liệu không
        if (typeof aiHistory !== 'undefined' && aiHistory.length > 0) {
            sourceData = aiHistory;
        } else {
            sourceData = [];
        }
    }
    
    currentStepsHistory = sourceData.map(s => ({
        r: s.r,
        c: s.c,
        // Nếu không có 'type' thì dùng 'action', không có nữa thì ghi 'UNKNOWN'
        type: s.type || s.action || 'STEP' 
    }));
    
    // Gán sự kiện click cho con số step
    const stepLink = document.getElementById('report-steps');
    stepLink.style.cursor = 'pointer';
    stepLink.style.textDecoration = 'underline';
    stepLink.onclick = openStepsModal;

    const miniContainer = document.getElementById('mini-map-container');
    if (miniContainer) miniContainer.classList.remove('active');
}

// Hàm mở Modal chi tiết các bước
function openStepsModal() {
    const modal = document.getElementById('steps-modal');
    const listContainer = document.getElementById('steps-detail-list');
    
    if (!listContainer) return;
    
    listContainer.innerHTML = ''; // Xóa list cũ
    
    if (currentStepsHistory.length === 0) {
        listContainer.innerHTML = '<div style="padding:20px; text-align:center">No step history recorded.</div>';
    } else {
        currentStepsHistory.forEach((s, i) => {
            const div = document.createElement('div');
            div.className = 'step-item';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.padding = '5px 0';
            div.style.borderBottom = '1px solid #333';
            
            const color = s.type === 'FLAG' ? 'var(--accent-danger)' : 'var(--accent-success)';
            div.innerHTML = `
                <span style="color:#888">#${i+1}</span>
                <span style="color:${color}; font-weight:bold">${s.type}</span>
                <span style="font-family:monospace">[${s.r}, ${s.c}]</span>
            `;
            listContainer.appendChild(div);
        });
    }
    modal.style.display = 'block';
}

function closeStepsModal() {
    document.getElementById('steps-modal').style.display = 'none';
}

// Alias để tương thích với các file cũ nếu cần
function closeModal() {
    closeStepsModal();
    const oldModal = document.getElementById('summary-modal');
    if(oldModal) oldModal.style.display = 'none';
}

function setMinimapFocus(isFocus) {
    const minimap = document.querySelector('.minimap-container');
    if (minimap) {
        if (isFocus) {
            minimap.classList.add('active');
        } else {
            minimap.classList.remove('active');
        }
    }
}

function showManualSummary(result) {
    const normalized = result === 'win' ? 'VICTORY' : 'DEFEAT';
    showSummaryModal({
        algo: 'Manual Play',
        result: normalized,
        time: timerElapsedTime.toFixed(1),
        steps: 0,
        opened: openedCellsCount,
        steps_history: []
    });
}

/**
 * Restore board state from a snapshot
 * Fully restores all cell states, clears all effects, and resets visualization
 */
function restoreBoardFromSnapshot(boardState) {
    if (!boardState) return;

    const size = boardState.length;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = document.getElementById(`cell-${r}-${c}`);
            if (!cell) continue;

            const cellData = boardState[r][c];
            
            // Completely reset the cell to default state
            cell.className = 'cell';
            cell.innerHTML = '';
            cell.removeAttribute('data-val');
            cell.style.backgroundColor = '';
            cell.style.color = '';
            cell.style.borderLeft = '';
            
            // Remove ALL classes that might be lingering
            cell.classList.remove('revealed', 'mine', 'flag', 'thinking', 'exploring', 'opening', 
                                 'flagging', 'backtracking', 'assuming-mine', 'assuming-safe', 'last-action');

            if (cellData.revealed) {
                // Cell is revealed
                cell.setAttribute('data-hide', 'false');
                cell.classList.add('revealed');
                if (cellData.isMine) {
                    cell.classList.add('mine');
                    cell.innerHTML = '<i class="fas fa-bomb"></i>';
                } else if (cellData.value > 0) {
                    cell.innerText = cellData.value;
                    cell.setAttribute('data-val', cellData.value);
                } else {
                    cell.innerHTML = '';
                }
                
                // If also flagged (shouldn't happen, but for safety)
                if (cellData.flagged) {
                    cell.classList.add('flag');
                    cell.innerHTML = '<i class="fas fa-flag"></i>';
                }
            } else if (cellData.flagged) {
                // Cell is not revealed but flagged
                cell.setAttribute('data-hide', 'true');
                cell.classList.add('flag');
                cell.innerHTML = '<i class="fas fa-flag"></i>';
            } else {
                // Cell is completely hidden - reset to pristine state
                cell.setAttribute('data-hide', 'true');
                cell.className = 'cell';
                cell.innerHTML = '';
            }
        }
    }
}

/**
 * Show snapshot viewer modal with board condition and memory stack
 */
/**
 * Show snapshot viewer modal with board condition and memory stack
 * Implements true time-travel to specific log index
 */
function showSnapshotViewer(snapshotIndex) {
    // Get the full snapshot from execution logger
    const fullSnapshot = executionLogger.restoreSnapshot(snapshotIndex);
    if (!fullSnapshot) {
        alert('Snapshot no longer available (circular buffer overwritten)');
        return;
    }

    // Create modal
    const modal = document.getElementById('snapshot-modal') || createSnapshotModal();
    
    // Store what step we should return to when closing modal
    const returnToStepIndex = typeof currentStepIndex !== 'undefined' ? currentStepIndex : aiHistory.length - 1;
    
    // FULL time-travel: reset board to baseline and apply snapshot
    restoreBoardFromSnapshot(fullSnapshot.board);
    
    // Update stack display to match this snapshot
    updateStack(fullSnapshot.stack);
    document.getElementById('stack-depth').innerText = fullSnapshot.stackSize;
    
    // Highlight the log entry for this step
    document.querySelectorAll('.log-entry.active-step').forEach(el => el.classList.remove('active-step'));
    const activeLog = document.getElementById(`log-step-${snapshotIndex}`);
    if (activeLog) {
        activeLog.classList.add('active-step');
    }
    
    // Populate memory stack in modal
    const stackContainer = document.getElementById('snapshot-stack-list');
    stackContainer.innerHTML = '';
    
    if (fullSnapshot.stack && fullSnapshot.stack.length > 0) {
        fullSnapshot.stack.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'stack-entry';
            const truncated = item.length > 80 ? item.substring(0, 77) + '...' : item;
            div.innerHTML = `<span class="stack-index">#${idx}</span> <span class="stack-content" title="${item}">${truncated}</span>`;
            stackContainer.appendChild(div);
        });
    } else {
        stackContainer.innerHTML = '<div style="text-align:center; color: var(--text-dim)">Stack is empty</div>';
    }

    // Get statistics
    const stats = executionLogger.getStats();
    const memUsage = executionLogger.getMemoryUsage();
    const bufferUsage = Math.round((stats.totalSnapshots / stats.maxSnapshots) * 100);
    
    // Update modal header info
    document.getElementById('snapshot-info').innerHTML = `
        <span><i class="fas fa-map-pin"></i> Step #${fullSnapshot.logIndex}</span>
        <span>|</span>
        <span><i class="fas fa-layer-group"></i> Stack Depth: ${fullSnapshot.stackSize}</span>
        <span>|</span>
        <span><i class="fas fa-memory"></i> ${memUsage}KB (${bufferUsage}% buffered)</span>
    `;

    // Show modal
    modal.style.display = 'block';
    
    // When closing modal, restore to the step we were at before opening
    const closeModal = () => {
        modal.style.display = 'none';
        // Use renderState from playback.js to properly time-travel back
        if (typeof renderState === 'function') {
            renderState(returnToStepIndex);
        }
    };
    
    // Add restore button functionality
    const restoreBtn = modal.querySelector('.snapshot-restore-btn');
    if (restoreBtn) {
        restoreBtn.onclick = closeModal;
    }
    
    // Also handle modal close button
    const closeBtn = modal.querySelector('.snapshot-close-btn');
    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }
}


/**
 * Create snapshot viewer modal (if not exists)
 */
function createSnapshotModal() {
    if (document.getElementById('snapshot-modal')) {
        return document.getElementById('snapshot-modal');
    }

    const modal = document.createElement('div');
    modal.id = 'snapshot-modal';
    modal.className = 'modal snapshot-modal';
    modal.innerHTML = `
        <div class="modal-content snapshot-content">
            <div class="modal-header">
                <span class="modal-title"><i class="fas fa-camera"></i> Execution Snapshot</span>
                <button class="modal-close" onclick="document.getElementById('snapshot-modal').style.display='none';">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div id="snapshot-info" class="snapshot-info"></div>
            <div class="modal-body snapshot-body">
                <div class="snapshot-sections">
                    <div class="snapshot-section memory-section">
                        <div class="section-header"><i class="fas fa-layer-group"></i> Memory Stack</div>
                        <div id="snapshot-stack-list" class="stack-list"></div>
                    </div>
                    <div class="snapshot-section board-section">
                        <div class="section-header"><i class="fas fa-chess-board"></i> Board Condition at This Step</div>
                        <div class="snapshot-board-info">
                            <p style="text-align: center; color: var(--text-dim); margin: 20px 0;">
                                The board on the left shows the state of all cells at this execution point.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn snapshot-restore-btn" onclick="document.getElementById('snapshot-modal').style.display='none';">
                    <i class="fas fa-undo"></i> Close
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    return modal;
}