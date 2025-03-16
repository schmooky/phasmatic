import { PHASE_REGISTRY } from 'phasmatic';
import { NodeType } from '../types';
/**
 * Generates a flow visualization from a Phasmatic state machine class
 */
export function generateFlowFromStateMachine(stateMachineClass, config = {}) {
    // Get the phase registry
    const phaseRegistry = stateMachineClass[PHASE_REGISTRY];
    if (!phaseRegistry) {
        throw new Error('No phase registry found. Make sure you have decorated your phase methods with @Phase.');
    }
    const nodes = [];
    const edges = [];
    // Create start node
    const startNode = {
        id: 'start',
        type: NodeType.State,
        position: { x: 0, y: 0 },
        data: {
            label: 'Start',
        },
        style: {
            background: '#d0f0d0',
            border: '1px solid #60a060',
        }
    };
    nodes.push(startNode);
    // Create a node for each phase
    let nodeId = 1;
    phaseRegistry.forEach((metadata, phaseName) => {
        const node = {
            id: phaseName,
            type: NodeType.State,
            position: { x: 0, y: nodeId * 100 }, // Initial position, will be adjusted by layout
            data: {
                label: phaseName,
                metadata: {
                    possibleNextPhases: metadata.possibleNextPhases,
                }
            }
        };
        nodes.push(node);
        nodeId++;
    });
    // Add edges between phases
    let edgeId = 1;
    phaseRegistry.forEach((metadata, phaseName) => {
        if (metadata.possibleNextPhases.length === 0) {
            // This is a terminal phase
            return;
        }
        // Create condition nodes for phases with multiple next phases if enabled
        if (metadata.possibleNextPhases.length > 1 && config.showConditions !== false) {
            // Create a condition node
            const conditionNodeId = `condition-${phaseName}`;
            const conditionNode = {
                id: conditionNodeId,
                type: NodeType.Condition,
                position: { x: 100, y: nodeId * 100 },
                data: {
                    label: `${phaseName} Condition`,
                    condition: 'Based on return value',
                    metadata: {
                        sourcePhase: phaseName,
                        targetPhases: metadata.possibleNextPhases,
                    }
                },
                style: {
                    background: '#f0e0d0',
                    border: '1px solid #c0a080',
                }
            };
            nodes.push(conditionNode);
            // Connect phase to condition
            const edgeToCondition = {
                id: `edge-${edgeId++}`,
                source: phaseName,
                target: conditionNodeId,
                animated: true,
            };
            edges.push(edgeToCondition);
            // Connect condition to next phases
            metadata.possibleNextPhases.forEach(nextPhase => {
                const edge = {
                    id: `edge-${edgeId++}`,
                    source: conditionNodeId,
                    target: nextPhase,
                    animated: false,
                    label: nextPhase,
                };
                edges.push(edge);
            });
        }
        else {
            // Direct connections without condition nodes
            metadata.possibleNextPhases.forEach(nextPhase => {
                const edge = {
                    id: `edge-${edgeId++}`,
                    source: phaseName,
                    target: nextPhase,
                    animated: true,
                };
                edges.push(edge);
            });
        }
    });
    // Connect start node to initial phase
    const initialPhase = stateMachineClass.prototype.constructor.initialPhase ||
        Array.from(phaseRegistry.keys())[0];
    if (initialPhase) {
        const startEdge = {
            id: `edge-start`,
            source: 'start',
            target: initialPhase,
            animated: true,
        };
        edges.push(startEdge);
    }
    // Apply layout - simplified version, could be enhanced with dagre or other layout libraries
    const layoutDirection = config.layoutDirection || 'TB';
    const nodeSpacing = config.nodeSpacing || 150;
    const rankSpacing = config.rankSpacing || 200;
    // Simple hierarchical layout (could be enhanced with a proper graph layout algorithm)
    const xOffset = 300;
    const yOffset = 100;
    let maxY = 0;
    nodes.forEach(node => {
        if (node.id === 'start') {
            node.position = { x: xOffset, y: 0 };
        }
        else if (node.type === NodeType.Condition) {
            const sourceNode = nodes.find(n => n.id === node.data.metadata?.sourcePhase);
            if (sourceNode) {
                node.position = {
                    x: sourceNode.position.x + nodeSpacing,
                    y: sourceNode.position.y
                };
            }
        }
        else {
            // Find incoming edges
            const incomingEdges = edges.filter(e => e.target === node.id);
            if (incomingEdges.length > 0) {
                // Position based on source nodes
                let sumX = 0;
                let sumY = 0;
                let validSources = 0;
                incomingEdges.forEach(edge => {
                    const sourceNode = nodes.find(n => n.id === edge.source);
                    if (sourceNode && sourceNode.id !== node.id) { // Avoid self-references
                        sumX += sourceNode.position.x;
                        sumY += sourceNode.position.y + rankSpacing;
                        validSources++;
                    }
                });
                if (validSources > 0) {
                    node.position = {
                        x: sumX / validSources,
                        y: sumY / validSources
                    };
                }
                else {
                    node.position = {
                        x: xOffset,
                        y: maxY + rankSpacing
                    };
                }
            }
            else {
                node.position = {
                    x: xOffset,
                    y: maxY + rankSpacing
                };
            }
        }
        maxY = Math.max(maxY, node.position.y);
    });
    // Extract metadata from the class
    const metadata = {
        name: stateMachineClass.name || 'State Machine',
        description: stateMachineClass.description,
    };
    return {
        nodes,
        edges,
        metadata
    };
}
//# sourceMappingURL=slowFactory.js.map