import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { Handle, Position } from 'reactflow';
export const ConditionNode = memo(({ data }) => {
    return (_jsxs("div", { className: "condition-node", children: [_jsx(Handle, { type: "target", position: Position.Top }), _jsxs("div", { className: "node-content", children: [_jsx("div", { className: "node-header", children: data.label }), _jsx("div", { className: "node-condition", children: data.condition })] }), _jsx(Handle, { type: "source", position: Position.Bottom, id: "true" }), _jsx(Handle, { type: "source", position: Position.Right, id: "false", style: { top: '50%', right: '-8px' } })] }));
});
//# sourceMappingURL=ConditionNode.js.map