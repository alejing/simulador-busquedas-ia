import { Stack, getNeighbors } from './utils.js';

export function runDFS(gridState) {
    const operations = []; // { action: 'explore'|'frontier', node: {r, c} }
    const { start, end, rows, cols } = gridState;

    if (!start || !end) return { operations, path: [] };

    const stack = new Stack();
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
    const parentMap = new Map();

    const toKey = (r, c) => `${r},${c}`;

    // Para poder reconstruir el camino exacto del DFS, guardamos en la pila { nodoActual, nodoPadre }
    stack.push({ current: start, parent: null });

    // Aniciar la raiz del árbol
    operations.push({ action: 'root', node: start });

    let found = false;
    let finalNode = null;
    let exploredCount = 0;

    while (!stack.isEmpty() && !found) {
        const { current, parent } = stack.pop();

        // Si ya lo visitamos por otra ruta en la pila, lo ignoramos
        if (visited[current.r][current.c]) continue;

        // Lo marcamos como visitado justo cuando lo sacamos de la pila (simulando recursión)
        visited[current.r][current.c] = true;
        if (parent) {
            parentMap.set(toKey(current.r, current.c), parent);
        }

        operations.push({ action: 'explore', node: current });
        exploredCount++;

        if (current.r === end.r && current.c === end.c) {
            found = true;
            finalNode = current;
            break;
        }

        const neighbors = getNeighbors(gridState, current.r, current.c);

        // Invertimos el orden de los vecinos para que el DFS priorice visualmente las direcciones
        // en su orden original (Arriba, Derecha, Abajo, Izquierda).
        // Al invertirlos e insertarlos en la pila LIFO, el primero (Arriba) queda en la cima y se explora de inmediato.
        neighbors.reverse();

        for (const neighbor of neighbors) {
            if (!visited[neighbor.r][neighbor.c]) {
                operations.push({ action: 'frontier', node: neighbor, parent: current });
                stack.push({ current: neighbor, parent: current });
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
            curr = parentMap.get(toKey(curr.r, curr.c));
            pathCost += 1;
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
