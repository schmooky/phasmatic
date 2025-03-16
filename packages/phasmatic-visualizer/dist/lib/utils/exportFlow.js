/**
 * Exports flow data to JSON
 */
export function exportToJson(flowData) {
    return JSON.stringify(flowData, null, 2);
}
/**
 * Exports flow data to Mermaid diagram
 */
export function exportToMermaid(flowData) {
    let mermaid = 'stateDiagram-v2\n';
    // Add start node
    mermaid += '    [*] --> ';
    // Find edge from start
    const startEdge = flowData.edges.find(edge => edge.source === 'start');
    if (startEdge) {
        mermaid += `${startEdge.target}\n`;
    }
    else {
        mermaid += 'State1\n';
    }
    // Add transitions
    flowData.edges.forEach(edge => {
        if (edge.source !== 'start' && !edge.source.startsWith('condition-')) {
            mermaid += `    ${edge.source} --> ${edge.target}\n`;
        }
    });
    // Add notes for conditions
    flowData.nodes
        .filter(node => node.type === 'condition')
        .forEach(node => {
        mermaid += `    note right of ${node.data.metadata?.sourcePhase}\n`;
        mermaid += `        ${node.data.condition}\n`;
        mermaid += `    end note\n`;
    });
    return mermaid;
}
//# sourceMappingURL=exportFlow.js.map