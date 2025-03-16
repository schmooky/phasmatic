import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from 'react';
import { Handle, Position } from 'reactflow';
export const StateNode = memo(({ data }) => {
    return (_jsxs("div", { className: "state-node", children: [_jsx(Handle, { type: "target", position: Position.Top }), _jsxs("div", { className: "node-content", children: [_jsx("div", { className: "node-header", children: data.label }), data.description && (_jsx("div", { className: "node-description", children: data.description }))] }), _jsx(Handle, { type: "source", position: Position.Bottom })] }));
});
//# sourceMappingURL=StateNode.js.map