export class TreeManager {
    constructor(containerId) {
        this.container = d3.select(`#${containerId}`);
        this.width = this.container.node().getBoundingClientRect().width;
        this.height = this.container.node().getBoundingClientRect().height || 500;

        // Tree data structure
        this.rootData = null;
        this.nodeMap = new Map(); // to quickly find nodes by id
        this.allNodes = [];

        // D3 setups
        this.svg = this.container.append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .call(d3.zoom().on("zoom", (event) => {
                this.g.attr("transform", event.transform);
            }))
            .append("g");

        this.g = this.svg.append("g").attr("transform", "translate(40,40)");

        this.treeLayout = d3.tree().nodeSize([40, 60]); // [width, height] spacing
    }

    reset() {
        this.rootData = null;
        this.nodeMap.clear();
        this.allNodes = [];
        this.updateD3();

        // Reset zoom
        this.svg.transition().duration(750)
            .call(d3.zoom().transform, d3.zoomIdentity.translate(this.width / 2, 40));
    }

    // Helper to generate a unique ID for grid nodes
    getNodeId(r, c) {
        return `${r},${c}`;
    }

    addRoot(r, c, cumulativeCost = null) {
        const id = this.getNodeId(r, c);
        this.rootData = {
            id: id,
            name: cumulativeCost !== null && cumulativeCost !== undefined ? `(${r},${c}) c:${cumulativeCost}` : `(${r},${c})`,
            status: 'frontier', // frontier, explored, path
            children: []
        };
        this.nodeMap.set(id, this.rootData);
        this.allNodes.push(this.rootData);
        this.updateD3();
    }

    addChild(parentR, parentC, childR, childC, status = 'frontier', stepCost = null, cumulativeCost = null) {
        if (!this.rootData) return;

        const parentGridId = this.getNodeId(parentR, parentC);

        // Find the LATEST instance of the parent node in the visual tree to attach to
        let targetParent = null;

        // Helper function to find the most recently added visual node that matches this grid coordinate
        // We traverse the allNodes array backwards to find the latest appended instance
        for (let i = this.allNodes.length - 1; i >= 0; i--) {
            const node = this.allNodes[i];
            if (node.gridId === parentGridId || node.id === parentGridId) {
                targetParent = node;
                break;
            }
        }

        if (!targetParent) {
            console.warn("Parent not found in tree for:", parentR, parentC);
            return;
        }

        const childId = this.getNodeId(childR, childC) + "_" + Math.random().toString(36).substring(7);

        const newChild = {
            id: childId,
            gridId: this.getNodeId(childR, childC),
            name: cumulativeCost !== null && cumulativeCost !== undefined ? `(${childR},${childC}) c:${cumulativeCost}` : `(${childR},${childC})`,
            stepCost: stepCost,
            status: status,
            children: []
        };

        targetParent.children.push(newChild);
        this.nodeMap.set(childId, newChild);
        this.allNodes.push(newChild);

        this.updateD3();
    }

    updateNodeStatus(r, c, status) {
        if (!this.rootData) return;
        const targetGridId = this.getNodeId(r, c);

        // Find ALL instances of this node in the search tree and update them
        this.allNodes.forEach(node => {
            if (node.gridId === targetGridId || node.id === targetGridId) {
                node.status = status;
            }
        });

        this.updateD3();
    }

    markFinalPath(pathArray) {
        if (!this.rootData || !pathArray || pathArray.length === 0) return;

        // Mark the nodes along the path
        pathArray.forEach(p => {
            this.updateNodeStatus(p.r, p.c, 'path');
        });
    }

    updateD3() {
        if (!this.rootData) {
            this.g.selectAll(".node").remove();
            this.g.selectAll(".link").remove();
            return;
        }

        const rootHierarchy = d3.hierarchy(this.rootData);
        const treeData = this.treeLayout(rootHierarchy);

        const nodes = treeData.descendants();
        const links = treeData.links();

        // Links
        const link = this.g.selectAll(".link-path")
            .data(links, d => d.target.data.id);

        const linkEnter = link.enter().insert("path", "g")
            .attr("class", d => `link link-path ${d.target.data.status === 'path' && d.source.data.status === 'path' ? 'path-link' : ''}`)
            .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y));

        link.merge(linkEnter).transition().duration(200)
            .attr("class", d => `link link-path ${d.target.data.status === 'path' && d.source.data.status === 'path' ? 'path-link' : ''}`)
            .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y));

        link.exit().remove();

        const linkText = this.g.selectAll(".link-text")
            .data(links.filter(d => d.target.data.stepCost !== null && d.target.data.stepCost !== undefined), d => d.target.data.id);

        linkText.enter().append("text")
            .attr("class", "link-text")
            .attr("dy", "-0.3em")
            .attr("text-anchor", "middle")
            .style("font-size", "10px")
            .style("fill", "#94a3b8")
            .style("text-shadow", "0 1px 2px black")
            .merge(linkText)
            .transition().duration(200)
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2)
            .text(d => `+${d.target.data.stepCost}`);

        linkText.exit().remove();

        // Nodes
        const node = this.g.selectAll(".node")
            .data(nodes, d => d.data.id);

        const nodeEnter = node.enter().append("g")
            .attr("class", d => `node ${d.data.status}`)
            .attr("transform", d => `translate(${d.x},${d.y})`);

        nodeEnter.append("circle")
            .attr("r", 20);

        nodeEnter.append("text")
            .attr("dy", ".35em")
            .attr("text-anchor", "middle")
            .text(d => d.data.name);

        const nodeUpdate = node.merge(nodeEnter).transition().duration(200)
            .attr("class", d => `node ${d.data.status}`)
            .attr("transform", d => `translate(${d.x},${d.y})`);

        node.exit().remove();
    }
}
