/**
 * Memory-Smart Execution Logger
 * Prevents memory overflow while allowing full state recovery
 */

class ExecutionLogger {
    constructor() {
        this.fullStateCache = null;    // Initial full board state
    }

    /**
     * Capture current board state from DOM
     * Returns compressed board representation
     */
    captureCurrentBoard() {
        const boardState = [];
        const boardSize = Math.sqrt(document.querySelectorAll('.cell').length);
        
        for (let r = 0; r < boardSize; r++) {
            const row = [];
            for (let c = 0; c < boardSize; c++) {
                const cell = document.getElementById(`cell-${r}-${c}`);
                if (cell) {
                    row.push({
                        revealed: cell.classList.contains('revealed'),
                        flagged: cell.classList.contains('flag'),
                        value: parseInt(cell.getAttribute('data-val')) || 0,
                        isMine: cell.classList.contains('mine')
                    });
                } else {
                    row.push({ revealed: false, flagged: false, value: 0, isMine: false });
                }
            }
            boardState.push(row);
        }
        return boardState;
    }

    /**
     * Clear cache (for new game)
     */
    clear() {
        this.fullStateCache = null;
    }
}

// Global instance
let executionLogger = new ExecutionLogger();
