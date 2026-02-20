import { GridManager } from './components/grid.js';
import { ControlsManager } from './components/controls.js';
import { TreeManager } from './components/tree.js';
import { AnimationController } from './algorithms/utils.js';
import { runBFS } from './algorithms/bfs.js';
import { runDFS } from './algorithms/dfs.js';
import { runUCS } from './algorithms/ucs.js';

class MazeSimulatorApp {
    constructor() {
        this.gridManager = new GridManager('grid-container');
        this.treeManager = new TreeManager('tree-container');
        this.controlsManager = new ControlsManager(this);

        // Application state
        this.isRunning = false;
        this.currentAlgorithm = 'bfs';
        this.speed = 50; // 1-100

        this.init();
    }

    init() {
        // Generate an initial 10x10 grid (rows x cols)
        this.gridManager.createGrid(10, 10);
        this.controlsManager.setupEventListeners();
    }

    startSimulation() {
        if (this.isRunning) return;

        const startNode = this.gridManager.getStartNode();
        const endNode = this.gridManager.getEndNode();

        if (!startNode || !endNode) {
            alert("Debes definir un punto de inicio y un punto de fin.");
            return;
        }

        this.isRunning = true;
        this.controlsManager.setSimulationState(true);
        this.gridManager.clearSimulation(); // Clear previous paths/explored nodes
        this.treeManager.reset();           // Clear search tree

        console.log(`Iniciando algoritmo: ${this.currentAlgorithm}`);

        // Get logical representation of the grid
        const gridState = this.gridManager.getGridState();

        // Dispatch algorithm
        let simulationResult;
        switch (this.currentAlgorithm) {
            case 'bfs':
                simulationResult = runBFS(gridState);
                break;
            case 'dfs':
                simulationResult = runDFS(gridState);
                break;
            case 'ucs':
                simulationResult = runUCS(gridState);
                break;
            default:
                console.error("Unknown algorithm");
                this.finishSimulation();
                return;
        }

        // Initialize Animation Controller with full results and GridState so it knows costs
        this.animationController = new AnimationController(this, simulationResult.operations, simulationResult.path, gridState);
        this.animationController.start();
    }

    finishSimulation() {
        this.isRunning = false;
        this.controlsManager.setSimulationState(false);
        console.log("Simulación finalizada.");
    }
}

// Bootstrap application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MazeSimulatorApp();
});
