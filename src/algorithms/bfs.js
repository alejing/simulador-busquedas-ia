import { Queue, getNeighbors } from './utils.js';

export function runBFS(gridState) {
    const operations = []; // { action: 'explore'|'frontier', node: {r, c} }
    const { start, end, rows, cols } = gridState;

    if (!start || !end) return { operations, path: [] };

    const queue = new Queue();

    // Track visited nodes and parents to reconstruct path
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const parentMap = new Map();

    // Helper to serialize coordinates for the map
    const toKey = (r, c) => `${r},${c}`;

    queue.enqueue(start);
    visited[start.r][start.c] = true;

    operations.push({ action: 'root', node: start });

    let found = false;
    let finalNode = null;
    let exploredCount = 0;

    while (!queue.isEmpty() && !found) {
        const current = queue.dequeue();

        // Mark as exploring
        operations.push({ action: 'explore', node: current });
        exploredCount++;

        // Check if reached target
        if (current.r === end.r && current.c === end.c) {
            found = true;
            finalNode = current;
            break;
        }

        // Get valid neighbors
        const neighbors = getNeighbors(gridState, current.r, current.c);

        for (const neighbor of neighbors) {
            if (!visited[neighbor.r][neighbor.c]) {
                visited[neighbor.r][neighbor.c] = true;
                parentMap.set(toKey(neighbor.r, neighbor.c), current);

                operations.push({ action: 'frontier', node: neighbor, parent: current });
                queue.enqueue(neighbor);
            }
        }
    }

    // Backtrack to find path
    const path = [];
    let pathCost = 0;

    if (found) {
        let curr = finalNode;
        while (curr && (curr.r !== start.r || curr.c !== start.c)) {
            path.unshift(curr); // Add to front
            const parent = parentMap.get(toKey(curr.r, curr.c));
            curr = parent;
            pathCost += 1; // BFS assumes uniform cost of 1 to count path length
        }
        path.unshift(start);
    }

    return {
        operations,
        path,
        stats: {
            explored: exploredCount,
            cost: path.length > 0 ? path.length - 1 : 0,
            length: path.length > 0 ? path.length - 1 : 0
        }
    };
}
