import { jsx as _jsx } from "react/jsx-runtime";
export default function Divider({ height = "1px" }) {
    return (_jsx("div", { "aria-hidden": "true", className: "w-full bg-border", style: { height } }));
}
