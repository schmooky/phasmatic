import React from 'react';
import 'reactflow/dist/style.css';
import { FlowData, FlowConfig } from '../types';
export interface FlowVisualizerProps {
    flowData: FlowData;
    config?: FlowConfig;
    onNodeClick?: (nodeId: string) => void;
    onExport?: (format: string, data: string) => void;
}
export declare const FlowVisualizer: React.FC<FlowVisualizerProps>;
