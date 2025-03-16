import { memo } from 'react';
import { Handle, Position } from 'reactflow';
export const ConditionNode = memo(({ data }) => {
    return className = "condition-node" >
        type;
    "target";
    position = { Position, : .Top } /  >
        className;
    "node-content" >
        className;
    "node-header" > { data, : .label } < /div>
        < div;
    className = "node-condition" > { data, : .condition } < /div>
        < /div>
        < Handle;
    type = "source";
    position = { Position, : .Bottom };
    id = "true" /  >
        type;
    "source";
    position = { Position, : .Right };
    id = "false";
    style = {};
    {
        top: '50%', right;
        '-8px';
    }
}, />
    < /div>);
;
//# sourceMappingURL=ConditionNode.js.map