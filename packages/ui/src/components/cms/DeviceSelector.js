import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ReloadIcon } from "@radix-ui/react-icons";
import { Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, } from "../atoms/shadcn";
import { devicePresets } from "../../utils/devicePresets";
export default function DeviceSelector({ deviceId, orientation, setDeviceId, toggleOrientation, }) {
    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Select, { value: deviceId, onValueChange: setDeviceId, children: [_jsx(SelectTrigger, { "aria-label": "Device", className: "w-40", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: devicePresets.map((p) => (_jsx(SelectItem, { value: p.id, children: p.label }, p.id))) })] }), _jsx(Button, { variant: "outline", onClick: toggleOrientation, "aria-label": "Rotate", children: _jsx(ReloadIcon, { className: orientation === "landscape" ? "rotate-90" : "" }) })] }));
}
