import { memo } from 'react';
import { Handle, Position } from 'reactflow';
export const StateNode = memo(({ data }) => {
    return className = "state-node" >
        type;
    "target";
    position = { Position, : .Top } /  >
        className;
    "node-content" >
        className;
    "node-header" > { data, : .label } < /div>;
    {
        data.description && className;
        "node-description" > { data, : .description } < /div>;
    }
});
/div>
    < Handle;
type = "source";
position = { Position, : .Bottom } /  >
    /div>;
;
;
//# sourceMappingURL=StateNode.js.map