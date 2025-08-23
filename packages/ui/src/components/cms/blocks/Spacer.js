import { jsx as _jsx } from "react/jsx-runtime";
export default function Spacer({ height = "1rem" }) {
    return _jsx("div", { "aria-hidden": "true", style: { height } });
}
