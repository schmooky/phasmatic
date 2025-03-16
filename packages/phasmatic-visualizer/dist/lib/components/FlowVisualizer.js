import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect } from 'react';
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, ReactFlowProvider, Panel } from 'reactflow';
import 'reactflow/dist/style.css';
import { NodeType } from '../types';
import { StateNode } from './StateNode';
import { ConditionNode } from './ConditionNode';
import { exportToJson, exportToMermaid } from '../utils/exportFlow';
// Register custom node types
const nodeTypes = {
    [NodeType.State]: StateNode,
    [NodeType.Condition]: ConditionNode,
};
const FlowVisualizerComponent = ({ flowData, config = {}, onNodeClick, onExport }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(flowData.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(flowData.edges);
    useEffect(() => {
        setNodes(flowData.nodes);
        setEdges(flowData.edges);
    }, [flowData, setNodes, setEdges]);
    const handleNodeClick = useCallback((event, node) => {
        if (onNodeClick) {
            onNodeClick(node.id);
        }
    }, [onNodeClick]);
    const handleExportJson = useCallback(() => {
        const jsonData = exportToJson({
            nodes,
            edges,
            metadata: flowData.metadata
        });
        if (onExport) {
            onExport('json', jsonData);
        }
        else {
            // Download as file
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jsonData);
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "flow-export.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }
    }, [nodes, edges, flowData.metadata, onExport]);
    const handleExportMermaid = useCallback(() => {
        const mermaidData = exportToMermaid({
            nodes,
            edges,
            metadata: flowData.metadata
        });
        if (onExport) {
            onExport('mermaid', mermaidData);
        }
        else {
            // Download as file
            const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(mermaidData);
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "flow-export.md");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }
    }, [nodes, edges, flowData.metadata, onExport]);
    return (_jsx("div", { style: { width: '100%', height: '100%' }, children: _jsxs(ReactFlow, { nodes: nodes, edges: edges, onNodesChange: onNodesChange, onEdgesChange: onEdgesChange, onNodeClick: handleNodeClick, nodeTypes: nodeTypes, fitView: config.fitView !== false, minZoom: 0.1, maxZoom: 1.5, attributionPosition: "bottom-left", children: [_jsx(Controls, {}), _jsx(MiniMap, { zoomable: true, pannable: true }), _jsx(Background, { color: "#f8f8f8", variant: "dots" }), _jsx(Panel, { position: "top-right", children: _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("button", { onClick: handleExportJson, className: "export-button", children: "Export JSON" }), _jsx("button", { onClick: handleExportMermaid, className: "export-button", children: "Export Mermaid" })] }) }), flowData.metadata?.name && (_jsx(Panel, { position: "top-left", children: _jsxs("div", { className: "flow-title", children: [_jsx("h2", { children: flowData.metadata.name }), flowData.metadata.description && (_jsx("p", { children: flowData.metadata.description }))] }) }))] }) }));
};
// Wrap with ReactFlowProvider to handle the ReactFlow context
export const FlowVisualizer = (props) => {
    return (_jsx(ReactFlowProvider, { children: _jsx(FlowVisualizerComponent, { ...props }) }));
};
//# sourceMappingURL=FlowVisualizer.js.map