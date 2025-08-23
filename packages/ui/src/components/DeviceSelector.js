"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DesktopIcon, LaptopIcon, MobileIcon } from "@radix-ui/react-icons";
import { Button, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, } from "./atoms/shadcn";
import { devicePresets, getLegacyPreset, } from "../utils/devicePresets";
export default function DeviceSelector({ deviceId, setDeviceId, }) {
    return (_jsxs("div", { className: "flex justify-center gap-2", children: [["desktop", "tablet", "mobile"].map((t) => {
                const preset = getLegacyPreset(t);
                const Icon = t === "desktop" ? DesktopIcon : t === "tablet" ? LaptopIcon : MobileIcon;
                return (_jsxs(Button, { variant: deviceId === preset.id ? "default" : "outline", onClick: () => setDeviceId(preset.id), "aria-label": t, children: [_jsx(Icon, {}), _jsx("span", { className: "sr-only", children: t.charAt(0).toUpperCase() + t.slice(1) })] }, t));
            }), _jsxs(Select, { value: deviceId, onValueChange: setDeviceId, children: [_jsx(SelectTrigger, { "aria-label": "Device", className: "w-40", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: devicePresets.map((p) => (_jsx(SelectItem, { value: p.id, children: p.label }, p.id))) })] })] }));
}
