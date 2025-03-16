import { Node, Edge } from 'reactflow';

/**
 * Types of nodes that can be rendered
 */
export enum NodeType {
  State = 'state',
  Condition = 'condition',
  Start = 'start',
  End = 'end'
}

/**
 * Node data for state nodes
 */
export interface StateNodeData {
  label: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Node data for condition nodes
 */
export interface ConditionNodeData {
  label: string;
  condition: string;
  metadata?: Record<string, any>;
}

/**
 * Type for nodes in the flow
 */
export type FlowNode = Node<StateNodeData | ConditionNodeData>;

/**
 * Type for edges in the flow
 */
export type FlowEdge = Edge;

/**
 * Flow data that can be exported and imported
 */
export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
  metadata?: {
    name: string;
    description?: string;
    version?: string;
    author?: string;
    created?: string;
    updated?: string;
  };
}

/**
 * Configuration for flow generation
 */
export interface FlowConfig {
  showConditions?: boolean;
  layoutDirection?: 'TB' | 'LR';
  nodeSpacing?: number;
  rankSpacing?: number;
  fitView?: boolean;
}