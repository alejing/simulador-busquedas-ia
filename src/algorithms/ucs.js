import { PriorityQueue, getNeighbors } from './utils.js';

export function runUCS(gridState) {
    const operations = []; // { action: 'explore'|'frontier', node: {r, c} }
    const { start, end, rows, cols } = gridState;

    if (!start || !end) return { operations, path: [] };

    const pq = new PriorityQueue();
    // Maps to store costs and origins
    const costs = new Map();
    const parentMap = new Map();

    const toKey = (r, c) => `${r},${c}`;
    const startKey = toKey(start.r, start.c);

    // Initialize start node
    pq.enqueue(start, 0);
    costs.set(startKey, 0);

    operations.push({ action: 'root', node: start, cumulativeCost: 0 });

    let found = false;
    let finalNode = null;
    let exploredCount = 0;

    while (!pq.isEmpty() && !found) {
        const { element: current, priority: currentCost } = pq.dequeue();

        // If we've found a better path since queuing this, skip
        if (currentCost > (costs.get(toKey(current.r, current.c)) || Infinity)) continue;

        // Mark as exploring
        operations.push({ action: 'explore', node: current });
        exploredCount++;

        if (current.r === end.r && current.c === end.c) {
            found = true;
            finalNode = current;
            break;
        }

        const neighbors = getNeighbors(gridState, current.r, current.c);

        for (const neighbor of neighbors) {
            // Current path cost to this neighbor = cost so far + cost of the neighbor cell
            // e.g., Mud node has cost 5, normal node 1
            const newCost = currentCost + neighbor.cost;
            const neighborKey = toKey(neighbor.r, neighbor.c);

            // If we found a cheaper way to reach this neighbor
            if (newCost < (costs.get(neighborKey) || Infinity)) {
                costs.set(neighborKey, newCost);
                parentMap.set(neighborKey, current);

                operations.push({ action: 'frontier', node: neighbor, parent: current, stepCost: neighbor.cost, cumulativeCost: newCost });
                pq.enqueue(neighbor, newCost);
            }
        }
    }

    // Backtracking
    const path = [];
    let pathCost = 0;

    if (found) {
        let curr = finalNode;
        while (curr && (curr.r !== start.r || curr.c !== start.c)) {
            path.unshift(curr);

            // We calculate total path cost
            const nodeData = gridState.grid[curr.r][curr.c];
            pathCost += nodeData.cost;

            curr = parentMap.get(toKey(curr.r, curr.c));
        }
        path.unshift(start);
    }

    return {
        operations,
        path,
        stats: {
            explored: exploredCount,
            cost: found ? pathCost : 0,    // Real cost taking into account edge weights
            length: found ? path.length - 1 : 0 // Hop count
        }
    };
}
