import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
const SnapLine = ({ x = null, y = null }) => {
    if (x === null && y === null)
        return null;
    return (_jsxs(_Fragment, { children: [x !== null && (_jsx("div", { className: "pointer-events-none absolute top-0 bottom-0 w-px bg-primary", style: { left: x } })), y !== null && (_jsx("div", { className: "pointer-events-none absolute left-0 right-0 h-px bg-primary", style: { top: y } }))] }));
};
export default SnapLine;
