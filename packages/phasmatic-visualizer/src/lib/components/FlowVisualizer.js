import { useCallback, useEffect } from 'react';
import { MiniMap, useNodesState, useEdgesState } from 'reactflow';
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
    return style = {};
    {
        width: '100%', height;
        '100%';
    }
};
 >
    nodes;
{
    nodes;
}
edges = { edges };
onNodesChange = { onNodesChange };
onEdgesChange = { onEdgesChange };
onNodeClick = { handleNodeClick };
nodeTypes = { nodeTypes };
fitView = { config, : .fitView !== false };
minZoom = { 0.1:  };
maxZoom = { 1.5:  };
attributionPosition = "bottom-left"
    >
        />
    < MiniMap;
zoomable;
pannable /  >
    color;
"#f8f8f8";
variant = "dots" /  >
    position;
"top-right" >
    style;
{
    {
        display: 'flex', gap;
        '8px';
    }
}
 >
    onClick;
{
    handleExportJson;
}
className = "export-button" >
    Export;
JSON
    < /button>
    < button;
onClick = { handleExportMermaid };
className = "export-button" >
    Export;
Mermaid
    < /button>
    < /div>
    < /Panel>;
{
    flowData.metadata?.name && position;
    "top-left" >
        className;
    "flow-title" >
        { flowData, : .metadata.name } < /h2>;
    {
        flowData.metadata.description && ({ flowData, : .metadata.description } < /p>);
    }
    /div>
        < /Panel>;
}
/ReactFlow>
    < /div>;
;
;
// Wrap with ReactFlowProvider to handle the ReactFlow context
export const FlowVisualizer = (props) => {
    return ({ ...props } /  >
        /ReactFlowProvider>);
};
//# sourceMappingURL=FlowVisualizer.js.map