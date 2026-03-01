function renderState(targetIndex) {
    if (targetIndex < 0 || targetIndex >= aiHistory.length) return;

    for (let i = 0; i <= targetIndex; i++) {
        const isFocus = (i === targetIndex);
        applyVisualStep(aiHistory[i], isFocus);
    }

    const currentStep = aiHistory[targetIndex];
    if (currentStep.stack) updateStack(currentStep.stack);
    document.getElementById('stack-depth').innerText = currentStep.stack ? currentStep.stack.length : 0;

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
        if (data.action === "VICTORY" && isFocus) {
            // Có thể thêm custom UI cho thắng ở đây
        }
        return; 
    }

    const cell = document.getElementById(`cell-${data.cell.r}-${data.cell.c}`);
    if (!cell) return;

    if (isFocus) {
        document.querySelectorAll('.last-action').forEach(el => el.classList.remove('last-action'));
        cell.classList.add('last-action');
    }

    cell.classList.remove('thinking', 'exploring', 'opening', 'flagging', 'backtracking');

    if (data.action === "THINKING") {
        cell.classList.add('thinking');
    } else if (data.action === "POP") {
        cell.classList.add('exploring');
    } else if (data.action === "OPEN") {
        cell.className = 'cell revealed opening';
        if (isFocus) cell.classList.add('last-action');
        if (data.val > 0) {
            cell.innerText = data.val;
            cell.setAttribute('data-val', data.val);
        }
    } else if (data.action === "FLAG") {
        cell.className = 'cell flag flagging';
        if (isFocus) cell.classList.add('last-action');
        cell.innerHTML = '<i class="fas fa-flag"></i>';
    } else if (data.action === "BACKTRACK") {
        cell.classList.add('backtracking');
    }
}