// Helper Data Structures

// LIFO - Last In First Out
export class Stack {
    constructor() {
        this.items = [];
    }
    push(element) { this.items.push(element); }
    pop() { return this.items.pop(); }
    isEmpty() { return this.items.length === 0; }
    size() { return this.items.length; }
}

// FIFO - First In First Out
export class Queue {
    constructor() {
        this.items = [];
    }
    enqueue(element) { this.items.push(element); }
    dequeue() { return this.items.shift(); }
    isEmpty() { return this.items.length === 0; }
    size() { return this.items.length; }
}

// Priority Queue - Orders by priority (lowest cost first)
export class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(element, priority) {
        const qElement = { element, priority };
        let added = false;

        // Simple implementation for small/medium grids
        for (let i = 0; i < this.items.length; i++) {
            if (qElement.priority < this.items[i].priority) {
                this.items.splice(i, 1, qElement);
                added = true;
                break;
            }
        }

        if (!added) {
            this.items.push(qElement);
        }
    }

    dequeue() {
        if (this.isEmpty()) return null;
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

// Helper to get neighbors (up, right, down, left)
export function getNeighbors(gridState, r, c) {
    const neighbors = [];
    const { rows, cols, grid } = gridState;

    // Directions: Up, Right, Down, Left
    const dirs = [[-1, 0], [0, 1], [1, 0], [0, -1]];

    for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;

        // Check bounds
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            const node = grid[nr][nc];
            // Skip walls
            if (node.type !== 'wall') {
                neighbors.push({ r: nr, c: nc, cost: node.cost });
            }
        }
    }
    return neighbors;
}

// Animation Controller
export class AnimationController {
    constructor(app, operations, finalPath, gridState) {
        this.app = app;
        this.gridManager = app.gridManager;
        this.controlsManager = app.controlsManager;

        this.operations = operations; // Array of { action: 'explore'|'frontier', current, parent }
        this.finalPath = finalPath;   // Array of { r, c }
        this.gridState = gridState;
        this.stepIndex = 0;

        // Running stats
        this.stats = { explored: 0, cost: 0, length: 0 };

        this.isAnimating = false;
        this.isPaused = false;
        this.animationId = null;
        this.lastFrameTime = performance.now();
    }

    start() {
        this.isAnimating = true;
        this.isPaused = false;
        this.stepIndex = 0;
        this.stats = { explored: 0, cost: 0, length: 0 };
        this.controlsManager.updateStats(this.stats.explored, this.stats.cost, this.stats.length);
        this.lastFrameTime = performance.now();
        this.loop();
    }

    getTotalSteps() {
        return this.operations.length + (this.finalPath ? this.finalPath.length : 0);
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused && this.isAnimating) {
            this.lastFrameTime = performance.now();
            this.loop();
        }
    }

    stepForward() {
        this.isPaused = true;
        if (this.stepIndex < this.getTotalSteps()) {
            this.applyStep(this.stepIndex);
            this.stepIndex++;
            if (this.stepIndex >= this.getTotalSteps()) {
                this.stop();
            }
        }
    }

    stepBackward() {
        this.isPaused = true;
        if (this.stepIndex > 0) {
            this.stepIndex--;
            this.drawStateToStep(this.stepIndex);

            // If we step back from the finished state, we need to unfinish to let user step forward again
            if (!this.isAnimating) {
                this.isAnimating = true;
                this.app.isRunning = true;
                this.app.controlsManager.setSimulationState(true);
            }
            this.app.controlsManager.updatePauseButtonText();
        }
    }

    drawStateToStep(targetIndex) {
        this.gridManager.clearSimulation();
        this.app.treeManager.reset();
        this.stats = { explored: 0, cost: 0, length: 0 };

        for (let i = 0; i < targetIndex; i++) {
            this.applyStep(i);
        }

        this.controlsManager.updateStats(this.stats.explored, this.stats.cost, this.stats.length);
    }

    applyStep(index) {
        if (index < this.operations.length) {
            const op = this.operations[index];
            if (op.action === 'root') {
                this.app.treeManager.addRoot(op.node.r, op.node.c, op.cumulativeCost);
            } else if (op.action === 'frontier') {
                this.gridManager.markFrontier(op.node.r, op.node.c);
                this.app.treeManager.addChild(op.parent.r, op.parent.c, op.node.r, op.node.c, 'frontier', op.stepCost, op.cumulativeCost);
            } else if (op.action === 'explore') {
                this.gridManager.markExplored(op.node.r, op.node.c);
                this.app.treeManager.updateNodeStatus(op.node.r, op.node.c, 'explored');
                this.stats.explored++; // increment explored count
            }
        } else {
            const pathIndex = index - this.operations.length;
            if (this.finalPath && pathIndex < this.finalPath.length) {
                const node = this.finalPath[pathIndex];

                // Exclude start node from path length/cost calculations to match expected behaviour
                if (pathIndex > 0) {
                    this.stats.length++;
                    const cellCost = this.gridState.grid[node.r][node.c].cost;
                    this.stats.cost += cellCost;
                }

                this.gridManager.markPath(node.r, node.c);
                this.app.treeManager.updateNodeStatus(node.r, node.c, 'path');
            }
        }
        this.controlsManager.updateStats(this.stats.explored, this.stats.cost, this.stats.length);
    }

    loop() {
        if (!this.isAnimating || this.isPaused) return;

        const delay = Math.max(0, 500 - (this.app.speed * 5));
        const now = performance.now();

        if (now - this.lastFrameTime >= delay) {
            this.lastFrameTime = now;

            let opsPerFrame = this.app.speed === 100 ? 5 : 1;
            while (opsPerFrame > 0 && this.stepIndex < this.getTotalSteps() && !this.isPaused) {
                this.applyStep(this.stepIndex);
                this.stepIndex++;
                opsPerFrame--;
            }

            if (this.stepIndex >= this.getTotalSteps()) {
                this.stop();
                return;
            }
        }

        if (this.isAnimating && !this.isPaused) {
            this.animationId = requestAnimationFrame(() => this.loop());
        }
    }

    stop() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Timeout just to let the last render frame hit if needed
        setTimeout(() => {
            if (this.stepIndex >= this.getTotalSteps()) {
                this.app.finishSimulation();
            }
        }, 50);
    }
}
