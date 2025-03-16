import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ConditionNodeData } from '../types';

export const ConditionNode = memo(({ data }: NodeProps<ConditionNodeData>) => {
  return (
    <div className="condition-node">
      <Handle type="target" position={Position.Top} />
      
      <div className="node-content">
        <div className="node-header">{data.label}</div>
        <div className="node-condition">{data.condition}</div>
      </div>
      
      <Handle type="source" position={Position.Bottom} id="true" />
      <Handle 
        type="source" 
        position={Position.Right} 
        id="false"
        style={{ top: '50%', right: '-8px' }}
      />
    </div>
  );
});
