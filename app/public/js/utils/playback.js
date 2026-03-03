/**
 * Reset entire board to baseline pristine state
 * Clears all reveals, flags, transient states, and text/icons
 */
function resetBoardToBaseline() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        // Remove all classes except 'cell'
        cell.className = 'cell';
        
        // Clear all content
        cell.innerHTML = '';
        
        // Remove data attributes
        cell.removeAttribute('data-val');
        
        // Reset to hidden state
        cell.setAttribute('data-hide', 'true');
        
        // Clear inline styles
        cell.style.backgroundColor = '';
        cell.style.color = '';
        cell.style.borderLeft = '';
    });
}

/**
 * Apply board state from snapshot to DOM
 * Assumes board has been reset to baseline first
 */
function applyBoardStateToDOM(boardState) {
    if (!boardState || !Array.isArray(boardState)) return;
    
    const size = boardState.length;
    
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cellData = boardState[r][c];
            const cellEl = document.getElementById(`cell-${r}-${c}`);
            if (!cellEl) continue;
            
            // Start fresh
            cellEl.className = 'cell';
            cellEl.innerHTML = '';
            cellEl.removeAttribute('data-val');
            
            if (cellData.revealed) {
                // Cell is revealed
                cellEl.setAttribute('data-hide', 'false');
                cellEl.classList.add('revealed');
                
                if (cellData.isMine) {
                    cellEl.classList.add('mine');
                    cellEl.innerHTML = '<i class="fas fa-bomb"></i>';
                } else if (cellData.value > 0) {
                    cellEl.innerText = cellData.value;
                    cellEl.setAttribute('data-val', cellData.value);
                }
            } else if (cellData.flagged) {
                // Cell is flagged but not revealed
                cellEl.setAttribute('data-hide', 'true');
                cellEl.classList.add('flag');
                cellEl.innerHTML = '<i class="fas fa-flag"></i>';
            } else {
                // Cell is hidden
                cellEl.setAttribute('data-hide', 'true');
            }
        }
    }
}

/**
 * Remove all transient visual state classes from a cell
 */
function removeTransientClasses(cellEl) {
    const transientClasses = [
        'thinking', 'exploring', 'opening', 'flagging', 
        'backtracking', 'assuming-mine', 'assuming-safe', 'last-action'
    ];
    cellEl.classList.remove(...transientClasses);
}

/**
 * Full time-travel: render state at specific log index
 * Smart replay: only resets when jumping backwards or large jumps forward
 */
function renderState(targetIndex) {
    if (targetIndex < 0 || targetIndex >= aiHistory.length) return;

    // Determine if we're going backwards (time-travel) or forward (normal playback)
    const isTimeTravel = typeof currentStepIndex !== 'undefined' 
        && currentStepIndex !== null 
        && currentStepIndex >= 0
        && targetIndex < currentStepIndex;
    
    // Determine if we need full replay (first time or big skip)
    const needsFullReplay = typeof currentStepIndex === 'undefined' 
        || currentStepIndex === null
        || currentStepIndex < 0  // Initial state
        || targetIndex > currentStepIndex + 1; // Skipping steps
    
    if (isTimeTravel) {
        // Going backwards: MUST reset board first to clear future states
        resetBoardToBaseline();
        for (let i = 0; i <= targetIndex; i++) {
            const isFocus = (i === targetIndex);
            applyVisualStep(aiHistory[i], isFocus);
        }
    } else if (needsFullReplay) {
        // Full replay from beginning (board should already be clean from drawBoard)
        for (let i = 0; i <= targetIndex; i++) {
            const isFocus = (i === targetIndex);
            applyVisualStep(aiHistory[i], isFocus);
        }
    } else {
        // Incremental forward: just apply the next step(s)
        for (let i = currentStepIndex + 1; i <= targetIndex; i++) {
            const isFocus = (i === targetIndex);
            applyVisualStep(aiHistory[i], isFocus);
        }
    }
    
    // Update stack from current step
    const currentStep = aiHistory[targetIndex];
    if (currentStep.stack) {
        updateStack(currentStep.stack);
        document.getElementById('stack-depth').innerText = currentStep.stack ? currentStep.stack.length : 0;
    }
    
    // Highlight active log entry
    document.querySelectorAll('.log-entry.active-step').forEach(el => el.classList.remove('active-step'));
    const activeLog = document.getElementById(`log-step-${targetIndex}`);
    if (activeLog) {
        activeLog.classList.add('active-step');
        activeLog.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    currentStepIndex = targetIndex;
}

function applyVisualStep(data, isFocus) {
    if (data.action === "OPEN_BATCH") {
        data.cells.forEach(cellData => {
            applyVisualStep({ action: "OPEN", cell: {r: cellData.r, c: cellData.c}, val: cellData.val }, false); 
        });
        if (isFocus && data.cells.length > 0) {
            const first = data.cells[0];
            const cell = document.getElementById(`cell-${first.r}-${first.c}`);
            if(cell) cell.classList.add('last-action');
        }
        return;
    }

    if (!data.cell) {
        return; 
    }

    const cell = document.getElementById(`cell-${data.cell.r}-${data.cell.c}`);
    if (!cell) return;

    if (isFocus) {
        document.querySelectorAll('.last-action').forEach(el => el.classList.remove('last-action'));
        cell.classList.add('last-action');
    }

    // Remove all transient classes before applying new one
    removeTransientClasses(cell);

    if (data.action === "THINKING") {
        cell.classList.add('thinking');
    } else if (data.action === "THINKING_MINE") {
        cell.classList.add('assuming-mine');
    } else if (data.action === "THINKING_SAFE") {
        cell.classList.add('assuming-safe');
    } else if (data.action === "POP") {
        cell.classList.add('exploring');
    } else if (data.action === "OPEN") {
        cell.className = 'cell revealed opening';
        cell.setAttribute('data-hide', 'false');
        if (isFocus) cell.classList.add('last-action');
        if (data.val > 0) {
            cell.innerText = data.val;
            cell.setAttribute('data-val', data.val);
        }
    } else if (data.action === "FLAG") {
        cell.className = 'cell flag flagging';
        cell.setAttribute('data-hide', 'true');
        if (isFocus) cell.classList.add('last-action');
        cell.innerHTML = '<i class="fas fa-flag"></i>';
    } else if (data.action === "BACKTRACK") {
        cell.classList.add('backtracking');
    }
}

/**
 * Time-travel to specific log index
 * Public API for jumping to any execution step
 * @param {number} index - The log step index to jump to
 */
function goToLog(index) {
    if (index < 0 || index >= aiHistory.length) {
        console.warn(`Invalid log index: ${index}. Must be between 0 and ${aiHistory.length - 1}`);
        return;
    }
    
    // Use renderState to perform full time-travel
    renderState(index);
    
    // Validation: ensure no unexpected transient classes remain
    validateBoardState(index);
}

/**
 * Dev helper: Validate that board state matches expected snapshot
 * Checks for lingering transient classes that shouldn't be there
 * @param {number} snapshotIndex - The index to validate against
 */
function validateBoardState(snapshotIndex) {
    if (typeof executionLogger === 'undefined') return;
    
    const snapshot = executionLogger.restoreSnapshot(snapshotIndex);
    if (!snapshot) return;
    
    const cells = document.querySelectorAll('.cell');
    const transientClasses = ['thinking', 'exploring', 'opening', 'flagging', 
                               'backtracking', 'assuming-mine', 'assuming-safe'];
    
    let hasErrors = false;
    
    cells.forEach(cell => {
        // Check for unexpected transient classes
        // (Note: 'last-action' and 'opening'/'flagging' are allowed for current step visualization)
        const unexpectedClasses = transientClasses.filter(cls => {
            // Allow 'opening' and 'flagging' on last-action cells (part of animation)
            if ((cls === 'opening' || cls === 'flagging') && cell.classList.contains('last-action')) {
                return false;
            }
            return cell.classList.contains(cls) && !cell.classList.contains('last-action');
        });
        
        if (unexpectedClasses.length > 0) {
            hasErrors = true;
            console.warn(`⚠️ Cell ${cell.id} has unexpected transient classes:`, unexpectedClasses);
        }
        
        // Validate revealed cells have data-hide="false"
        if (cell.classList.contains('revealed') && cell.getAttribute('data-hide') !== 'false') {
            hasErrors = true;
            console.warn(`⚠️ Cell ${cell.id} is revealed but data-hide is not "false"`);
        }
        
        // Validate hidden cells have data-hide="true"
        if (!cell.classList.contains('revealed') && !cell.classList.contains('flag') 
            && cell.getAttribute('data-hide') !== 'true') {
            hasErrors = true;
            console.warn(`⚠️ Cell ${cell.id} is hidden but data-hide is not "true"`);
        }
    });
    
    if (hasErrors) {
        console.error(`❌ Board state validation failed for log index ${snapshotIndex}`);
    } else {
        console.log(`✅ Board state validated successfully for log index ${snapshotIndex}`);
    }
}
