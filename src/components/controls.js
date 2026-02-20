export class ControlsManager {
    constructor(appInstance) {
        this.app = appInstance;

        // DOM Elements
        this.algorithmSelect = document.getElementById('algorithm-select');
        this.drawRadios = document.querySelectorAll('input[name="draw-tool"]');
        this.speedSlider = document.getElementById('speed-slider');

        this.btnStart = document.getElementById('btn-start');
        this.btnClearPath = document.getElementById('btn-clear-path');
        this.btnClearAll = document.getElementById('btn-clear-all');

        // Generation controls
        this.btnGenWalls = document.getElementById('btn-gen-walls');
        this.btnGenMixed = document.getElementById('btn-gen-mixed');

        // Step controls
        this.btnStepBack = document.getElementById('btn-step-back');
        this.btnPause = document.getElementById('btn-pause');
        this.btnStepForward = document.getElementById('btn-step-forward');

        // Stats elements
        this.statExplored = document.getElementById('stat-explored');
        this.statCost = document.getElementById('stat-cost');
        this.statLength = document.getElementById('stat-length');
    }

    setupEventListeners() {
        // Algorithm selection
        this.algorithmSelect.addEventListener('change', (e) => {
            this.app.currentAlgorithm = e.target.value;
            // Resets paths when algorithm changes
            if (!this.app.isRunning) {
                this.app.gridManager.clearSimulation();
                this.resetStats();
            }
        });

        // Draw tools
        this.drawRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.app.gridManager.setTool(e.target.value);
            });
        });

        // Speed slider
        this.speedSlider.addEventListener('input', (e) => {
            this.app.speed = parseInt(e.target.value);
        });

        // Buttons
        this.btnStart.addEventListener('click', () => {
            if (this.app.isRunning) return;
            this.app.startSimulation();
        });

        this.btnClearPath.addEventListener('click', () => {
            if (this.app.isRunning) return;
            this.app.gridManager.clearSimulation();
            this.resetStats();
        });

        this.btnClearAll.addEventListener('click', () => {
            if (this.app.isRunning) return;
            this.app.gridManager.clearAll();
            this.resetStats();
        });

        // Generation events
        this.btnGenWalls.addEventListener('click', () => {
            if (this.app.isRunning) return;
            this.app.gridManager.generateRandomMaze(0.25, 0); // 25% walls
            this.resetStats();
        });

        this.btnGenMixed.addEventListener('click', () => {
            if (this.app.isRunning) return;
            this.app.gridManager.generateRandomMaze(0.20, 0.15); // 20% walls, 15% mud
            this.resetStats();
        });

        // Step controls events
        this.btnStepBack.addEventListener('click', () => {
            if (this.app.animationController) {
                this.app.animationController.stepBackward();
                this.updatePauseButtonText();
            }
        });

        this.btnPause.addEventListener('click', () => {
            if (this.app.animationController) {
                this.app.animationController.togglePause();
                this.updatePauseButtonText();
            }
        });

        this.btnStepForward.addEventListener('click', () => {
            if (this.app.animationController) {
                this.app.animationController.stepForward();
                this.updatePauseButtonText();
            }
        });
    }

    setSimulationState(isRunning) {
        // Disable inputs during simulation
        this.algorithmSelect.disabled = isRunning;
        this.btnClearPath.disabled = isRunning;
        this.btnClearAll.disabled = isRunning;

        this.drawRadios.forEach(radio => {
            radio.disabled = isRunning;
        });

        this.btnGenWalls.disabled = isRunning;
        this.btnGenMixed.disabled = isRunning;

        if (isRunning) {
            this.btnStart.classList.add('disabled');
            this.btnStart.textContent = 'Simulando...';
            this.resetStats(); // Reset stats when starting new query
            this.btnStepBack.disabled = false;
            this.btnPause.disabled = false;
            this.btnStepForward.disabled = false;
            this.btnPause.textContent = '⏸'; // Emoji de pausa
        } else {
            this.btnStart.classList.remove('disabled');
            this.btnStart.textContent = 'Iniciar Simulación';

            // Keep step buttons active if we finished successfully so they can step back
            const hasAnimController = !!this.app.animationController;
            this.btnStepBack.disabled = !hasAnimController;
            this.btnPause.disabled = true; // disable pause if finished
            this.btnStepForward.disabled = true; // can't step forward if finished
        }
    }

    updatePauseButtonText() {
        if (this.app.animationController && this.app.animationController.isPaused) {
            this.btnPause.textContent = '▶'; // Play
        } else {
            this.btnPause.textContent = '⏸'; // Pausa
        }
    }

    updateStats(exploredNodes, cost, pathLength) {
        this.statExplored.textContent = exploredNodes;
        this.statCost.textContent = cost;
        this.statLength.textContent = pathLength;
    }

    resetStats() {
        this.statExplored.textContent = '0';
        this.statCost.textContent = '0';
        this.statLength.textContent = '0';
    }
}
