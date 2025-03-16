import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

import { FlowData, FlowConfig, NodeType } from '../types';
import { StateNode } from './StateNode';
import { ConditionNode } from './ConditionNode';
import { exportToJson, exportToMermaid } from '../utils/exportFlow';

// Register custom node types
const nodeTypes = {
  [NodeType.State]: StateNode,
  [NodeType.Condition]: ConditionNode,
};

export interface FlowVisualizerProps {
  flowData: FlowData;
  config?: FlowConfig;
  onNodeClick?: (nodeId: string) => void;
  onExport?: (format: string, data: string) => void;
}

const FlowVisualizerComponent: React.FC<FlowVisualizerProps> = ({
  flowData,
  config = {},
  onNodeClick,
  onExport
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(flowData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowData.edges);
  
  useEffect(() => {
    setNodes(flowData.nodes);
    setEdges(flowData.edges);
  }, [flowData, setNodes, setEdges]);
  
  const handleNodeClick = useCallback((event: React.MouseEvent, node: any) => {
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
    } else {
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
    } else {
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
  
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView={config.fitView !== false}
        minZoom={0.1}
        maxZoom={1.5}
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap zoomable pannable />
        <Background color="#f8f8f8" variant="dots" />
        <Panel position="top-right">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleExportJson} className="export-button">
              Export JSON
            </button>
            <button onClick={handleExportMermaid} className="export-button">
              Export Mermaid
            </button>
          </div>
        </Panel>
        {flowData.metadata?.name && (
          <Panel position="top-left">
            <div className="flow-title">
              <h2>{flowData.metadata.name}</h2>
              {flowData.metadata.description && (
                <p>{flowData.metadata.description}</p>
              )}
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

// Wrap with ReactFlowProvider to handle the ReactFlow context
export const FlowVisualizer: React.FC<FlowVisualizerProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowVisualizerComponent {...props} />
    </ReactFlowProvider>
  );
};