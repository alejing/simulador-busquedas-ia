export class GridManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.gridElement = null;
        this.cells = []; // 2D Array of DOM elements
        this.rows = 0;
        this.cols = 0;

        // Grid state
        this.state = []; // 2D array representing nodes

        this.startNode = null; // {r, c}
        this.endNode = null;   // {r, c}

        // Drawing interactions
        this.isMouseDown = false;
        this.currentTool = 'wall';
    }

    createGrid(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.cells = [];
        this.state = [];

        this.container.innerHTML = '';

        this.gridElement = document.createElement('div');
        this.gridElement.className = 'grid';
        // Configure CSS Grid dynamically
        this.gridElement.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
        this.gridElement.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;

        // Create DOM nodes and state
        for (let r = 0; r < rows; r++) {
            const rowElements = [];
            const rowState = [];

            for (let c = 0; c < cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;

                // Add coordinate text for better UX
                const coordText = document.createElement('span');
                coordText.className = 'cell-coord';
                coordText.innerText = `${r},${c}`;
                cell.appendChild(coordText);

                // Add event listeners for drawing
                cell.addEventListener('mousedown', (e) => this.handleCellInteraction(e, r, c));
                cell.addEventListener('mouseenter', (e) => {
                    if (this.isMouseDown) this.handleCellInteraction(e, r, c);
                });

                this.gridElement.appendChild(cell);
                rowElements.push(cell);

                // State: 1 = wall, 0 = empty, 5 = mud (high cost)
                rowState.push({
                    type: 'empty',
                    cost: 1,      // Default cost
                    visited: false,
                    isPath: false
                });
            }
            this.cells.push(rowElements);
            this.state.push(rowState);
        }

        this.container.appendChild(this.gridElement);

        // Global mouse up to stop drawing
        document.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        // Prevent dragging elements issues
        this.gridElement.addEventListener('dragstart', (e) => e.preventDefault());

        // Set default start and end nodes
        this.setStartNode(Math.floor(rows / 2), Math.floor(cols * 0.2));
        this.setEndNode(Math.floor(rows / 2), Math.floor(cols * 0.8));
    }

    setTool(tool) {
        this.currentTool = tool;
    }

    handleCellInteraction(e, r, c) {
        e.preventDefault(); // Prevent default dragging
        if (e.type === 'mousedown') this.isMouseDown = true;

        // Don't modify if app is running algorithm
        if (window.app && window.app.isRunning) return;

        // Check if modifying start or end
        const isStart = this.startNode && this.startNode.r === r && this.startNode.c === c;
        const isEnd = this.endNode && this.endNode.r === r && this.endNode.c === c;

        switch (this.currentTool) {
            case 'start':
                if (!isEnd) this.setStartNode(r, c);
                break;
            case 'end':
                if (!isStart) this.setEndNode(r, c);
                break;
            case 'wall':
                if (!isStart && !isEnd) this.updateCell(r, c, 'wall', 0); // Cost 0 or Infinity conceptually
                break;
            case 'mud':
                if (!isStart && !isEnd) this.updateCell(r, c, 'mud', 5); // Cost 5 for UCS
                break;
            case 'erase':
                if (!isStart && !isEnd) this.updateCell(r, c, 'empty', 1);
                break;
        }
    }

    updateCell(r, c, type, cost) {
        const cell = this.cells[r][c];
        const node = this.state[r][c];

        // Remove old classes
        cell.classList.remove('wall', 'mud', 'empty');

        // Set new properties
        node.type = type;
        node.cost = cost;
        cell.classList.add(type);

        // Clear simulation tags if any
        this.clearCellSimulation(r, c);
    }

    setStartNode(r, c) {
        if (this.startNode) {
            // Clear old start
            const { r: oldR, c: oldC } = this.startNode;
            this.cells[oldR][oldC].classList.remove('start');
            this.updateCell(oldR, oldC, 'empty', 1);
        }

        this.startNode = { r, c };
        this.updateCell(r, c, 'start', 1);
        this.cells[r][c].classList.add('start');
    }

    setEndNode(r, c) {
        if (this.endNode) {
            // Clear old end
            const { r: oldR, c: oldC } = this.endNode;
            this.cells[oldR][oldC].classList.remove('end');
            this.updateCell(oldR, oldC, 'empty', 1);
        }

        this.endNode = { r, c };
        this.updateCell(r, c, 'end', 1);
        this.cells[r][c].classList.add('end');
    }

    getStartNode() {
        return this.startNode;
    }

    getEndNode() {
        return this.endNode;
    }

    getGridState() {
        // Return a clone or representation for algorithms
        return {
            rows: this.rows,
            cols: this.cols,
            grid: this.state,
            start: this.startNode,
            end: this.endNode
        };
    }

    clearCellSimulation(r, c) {
        const cell = this.cells[r][c];
        const node = this.state[r][c];

        cell.classList.remove('explored', 'frontier', 'path');
        node.visited = false;
        node.isPath = false;
    }

    clearSimulation() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                this.clearCellSimulation(r, c);
            }
        }
    }

    clearAll() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                // Reset to empty except for start/end
                const isStart = this.startNode && this.startNode.r === r && this.startNode.c === c;
                const isEnd = this.endNode && this.endNode.r === r && this.endNode.c === c;

                if (!isStart && !isEnd) {
                    this.updateCell(r, c, 'empty', 1);
                } else {
                    this.clearCellSimulation(r, c);
                }
            }
        }
    }

    generateRandomMaze(wallProb, mudProb = 0) {
        if (window.app && window.app.isRunning) return;
        this.clearAll(); // First clear the grid

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.isEndpoint(r, c)) continue;

                const rand = Math.random();
                if (rand < wallProb) {
                    this.updateCell(r, c, 'wall', 0);
                } else if (rand < wallProb + mudProb) {
                    this.updateCell(r, c, 'mud', 5);
                } else {
                    this.updateCell(r, c, 'empty', 1);
                }
            }
        }
    }

    // Presentation layer functions (to be called by algorithms)
    markFrontier(r, c) {
        if (!this.isEndpoint(r, c)) this.cells[r][c].classList.add('frontier');
    }

    markExplored(r, c) {
        if (!this.isEndpoint(r, c)) {
            this.cells[r][c].classList.remove('frontier');
            this.cells[r][c].classList.add('explored');
        }
        this.state[r][c].visited = true;
    }

    markPath(r, c) {
        if (!this.isEndpoint(r, c)) {
            this.cells[r][c].classList.remove('frontier', 'explored');
            this.cells[r][c].classList.add('path');
        }
        this.state[r][c].isPath = true;
    }

    isEndpoint(r, c) {
        const isStart = this.startNode && r === this.startNode.r && c === this.startNode.c;
        const isEnd = this.endNode && r === this.endNode.r && c === this.endNode.c;
        return isStart || isEnd;
    }
}
