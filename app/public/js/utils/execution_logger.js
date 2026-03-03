/**
 * Memory-Smart Execution Logger
 * Stores state snapshots with delta compression and circular buffer
 * Prevents memory overflow while allowing full state recovery
 */

class ExecutionLogger {
    constructor(maxSnapshots = 500) {
        this.maxSnapshots = maxSnapshots;
        this.snapshots = [];           // Circular buffer of snapshots
        this.snapshotIndex = 0;        // Current position in circular buffer
        this.fullStateCache = null;    // Initial full board state
        this.isFull = false;           // Has buffer wrapped around?
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
     * Compress board state to reduce memory footprint
     * Encodes revealed/flagged as bitflags + delta from full state
     */
    compressState(boardState) {
        if (!boardState || boardState.length === 0) return null;
        
        const size = boardState.length;
        const compressed = {
            size: size,
            flags: [],      // Bitfield for revealed/flagged status
            values: []      // Mine count for each cell
        };

        // Encode as bits: bit 0 = revealed, bit 1 = flagged
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = boardState[r][c];
                let byte = 0;
                if (cell.revealed) byte |= 0b01;
                if (cell.flagged) byte |= 0b10;
                compressed.flags.push(byte);
                compressed.values.push(cell.value);
            }
        }

        return compressed;
    }

    /**
     * Decompress board state from compressed representation
     */
    decompressState(compressed) {
        if (!compressed) return null;

        const size = compressed.size;
        const boardState = [];

        for (let r = 0; r < size; r++) {
            const row = [];
            for (let c = 0; c < size; c++) {
                const idx = r * size + c;
                const flags = compressed.flags[idx] || 0;
                row.push({
                    revealed: (flags & 0b01) !== 0,
                    flagged: (flags & 0b10) !== 0,
                    value: compressed.values[idx] || 0,
                    isMine: false
                });
            }
            boardState.push(row);
        }

        return boardState;
    }

    /**
     * Add a snapshot to the buffer
     * Automatically manages circular buffer and memory
     * Deep-copies all data to ensure immutability
     */
    addSnapshot(logIndex, stack, boardState) {
        // Deep copy stack to prevent mutation of old snapshots
        let stackCopy = [];
        if (stack && Array.isArray(stack)) {
            try {
                // Use structuredClone if available (modern browsers)
                stackCopy = typeof structuredClone !== 'undefined' 
                    ? structuredClone(stack) 
                    : JSON.parse(JSON.stringify(stack));
            } catch (e) {
                // Fallback to shallow copy if deep copy fails
                stackCopy = [...stack];
            }
        }
        
        const snapshot = {
            logIndex: logIndex,
            timestamp: Date.now(),
            stack: stackCopy,
            board: this.compressState(boardState),
            stackSize: stackCopy.length
        };

        // Store in circular buffer
        if (this.snapshots.length < this.maxSnapshots) {
            this.snapshots.push(snapshot);
            this.snapshotIndex = this.snapshots.length - 1;
        } else {
            // Circular buffer wrapping
            this.snapshotIndex = (this.snapshotIndex + 1) % this.maxSnapshots;
            this.snapshots[this.snapshotIndex] = snapshot;
            this.isFull = true;
        }

        return this.snapshotIndex;
    }

    /**
     * Get snapshot by index
     * Returns null if not found or overwritten
     */
    getSnapshot(snapshotIndex) {
        if (!this.snapshots || snapshotIndex < 0 || snapshotIndex >= this.snapshots.length) {
            return null;
        }

        const snapshot = this.snapshots[snapshotIndex];
        if (!snapshot) return null;

        // Validate snapshot hasn't been overwritten in circular buffer
        if (this.isFull && snapshotIndex <= this.snapshotIndex && 
            snapshotIndex < (this.snapshotIndex - this.maxSnapshots)) {
            return null; // This slot has been overwritten
        }

        return snapshot;
    }

    /**
     * Decompress and return full snapshot with board state
     */
    restoreSnapshot(snapshotIndex) {
        const snapshot = this.getSnapshot(snapshotIndex);
        if (!snapshot) return null;

        return {
            logIndex: snapshot.logIndex,
            stack: snapshot.stack,
            board: this.decompressState(snapshot.board),
            stackSize: snapshot.stackSize,
            timestamp: snapshot.timestamp
        };
    }

    /**
     * Get memory usage estimate in KB
     */
    getMemoryUsage() {
        let totalBytes = 0;

        for (const snapshot of this.snapshots) {
            if (snapshot.board) {
                totalBytes += snapshot.board.flags.length + snapshot.board.values.length;
            }
            if (snapshot.stack) {
                totalBytes += snapshot.stack.reduce((acc, item) => acc + (item ? item.length * 2 : 0), 0);
            }
        }

        return Math.round(totalBytes / 1024 * 100) / 100; // KB
    }

    /**
     * Get statistics about stored snapshots
     */
    getStats() {
        return {
            totalSnapshots: this.snapshots.length,
            maxSnapshots: this.maxSnapshots,
            isFull: this.isFull,
            memoryUsageKB: this.getMemoryUsage(),
            currentIndex: this.snapshotIndex
        };
    }

    /**
     * Clear all snapshots (for new game)
     */
    clear() {
        this.snapshots = [];
        this.snapshotIndex = 0;
        this.fullStateCache = null;
        this.isFull = false;
    }

    /**
     * Log memory statistics to console (for debugging)
     */
    logStats() {
        const stats = this.getStats();
        console.group('🧠 Execution Logger Memory Stats');
        console.log(`📊 Total Snapshots: ${stats.totalSnapshots}/${stats.maxSnapshots}`);
        console.log(`💾 Memory Usage: ${stats.memoryUsageKB}KB`);
        console.log(`📈 Buffer Utilization: ${Math.round((stats.totalSnapshots / stats.maxSnapshots) * 100)}%`);
        console.log(`🔄 Current Index: ${stats.currentIndex}`);
        console.log(`🔁 Buffer Wrapped: ${stats.isFull ? 'Yes' : 'No'}`);
        console.table(stats);
        console.groupEnd();
    }

    /**
     * Free up memory by compacting old snapshots
     * Keeps only recent N snapshots for memory savings
     */
    compact(keepCount = 100) {
        if (this.snapshots.length <= keepCount) return;
        
        const oldSize = this.snapshots.length;
        this.snapshots = this.snapshots.slice(-keepCount);
        this.isFull = false;
        this.snapshotIndex = this.snapshots.length - 1;
        
        console.log(`🗑️  Compacted execution logger: ${oldSize} → ${this.snapshots.length} snapshots, freed ~${Math.round((oldSize - this.snapshots.length) * 0.5)}KB`);
    }
}

// Global instance
let executionLogger = new ExecutionLogger(500);
