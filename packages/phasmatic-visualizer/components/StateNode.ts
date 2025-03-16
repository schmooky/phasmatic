import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { StateNodeData } from '../types';

export const StateNode = memo(({ data }: NodeProps<StateNodeData>) => {
  return (
    <div className="state-node">
      <Handle type="target" position={Position.Top} />
      
      <div className="node-content">
        <div className="node-header">{data.label}</div>
        {data.description && (
          <div className="node-description">{data.description}</div>
        )}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});