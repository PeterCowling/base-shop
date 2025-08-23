import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ReloadIcon } from "@radix-ui/react-icons";
import { useEffect } from "react";
import { Button, Input, Dialog, DialogContent, DialogTitle, DialogTrigger, } from "../../atoms/shadcn";
import { getLegacyPreset } from "../../../utils/devicePresets";
import DeviceSelector from "../../common/DeviceSelector";
const PageToolbar = ({ viewport, deviceId, setDeviceId, orientation, setOrientation, locale, setLocale, locales, progress, isValid, showGrid, toggleGrid, gridCols, setGridCols, }) => {
    useEffect(() => {
        const presets = {
            1: getLegacyPreset("desktop").id,
            2: getLegacyPreset("tablet").id,
            3: getLegacyPreset("mobile").id,
        };
        const handler = (e) => {
            if (e.target instanceof HTMLElement &&
                (e.target.tagName === "INPUT" ||
                    e.target.tagName === "TEXTAREA" ||
                    e.target.tagName === "SELECT" ||
                    e.target.isContentEditable)) {
                return;
            }
            const id = presets[e.key];
            if (id && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                setDeviceId(id);
                setOrientation("portrait");
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [setDeviceId, setOrientation]);
    return (_jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(DeviceSelector, { deviceId: deviceId, onChange: (id) => {
                            setDeviceId(id);
                            setOrientation("portrait");
                        }, showLegacyButtons: true }), _jsx(Button, { variant: "outline", onClick: () => setOrientation(orientation === "portrait" ? "landscape" : "portrait"), "aria-label": "Rotate", children: _jsx(ReloadIcon, { className: orientation === "landscape" ? "rotate-90" : "" }) }), _jsxs(Dialog, { children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { variant: "outline", "aria-label": "Keyboard shortcuts", children: "?" }) }), _jsxs(DialogContent, { className: "space-y-2", children: [_jsx(DialogTitle, { children: "Keyboard shortcuts" }), _jsxs("ul", { className: "space-y-1 text-sm", children: [_jsxs("li", { children: [_jsx("kbd", { children: "Ctrl" }), "/", _jsx("kbd", { children: "\u2318" }), " + ", _jsx("kbd", { children: "S" }), " Save"] }), _jsxs("li", { children: [_jsx("kbd", { children: "Ctrl" }), "/", _jsx("kbd", { children: "\u2318" }), " + ", _jsx("kbd", { children: "P" }), " Toggle preview"] }), _jsxs("li", { children: [_jsx("kbd", { children: "Ctrl" }), "/", _jsx("kbd", { children: "\u2318" }), " + ", _jsx("kbd", { children: "Shift" }), " + ", _jsx("kbd", { children: "[" }), " Rotate device left"] }), _jsxs("li", { children: [_jsx("kbd", { children: "Ctrl" }), "/", _jsx("kbd", { children: "\u2318" }), " + ", _jsx("kbd", { children: "Shift" }), " + ", _jsx("kbd", { children: "]" }), " Rotate device right"] }), _jsxs("li", { children: [_jsx("kbd", { children: "Ctrl" }), "/", _jsx("kbd", { children: "\u2318" }), " + ", _jsx("kbd", { children: "Z" }), " Undo"] }), _jsxs("li", { children: [_jsx("kbd", { children: "Ctrl" }), "/", _jsx("kbd", { children: "\u2318" }), " + ", _jsx("kbd", { children: "Y" }), " Redo"] }), _jsxs("li", { children: [_jsx("kbd", { children: "Ctrl" }), "/", _jsx("kbd", { children: "\u2318" }), " + ", _jsx("kbd", { children: "1" }), " Desktop view"] }), _jsxs("li", { children: [_jsx("kbd", { children: "Ctrl" }), "/", _jsx("kbd", { children: "\u2318" }), " + ", _jsx("kbd", { children: "2" }), " Tablet view"] }), _jsxs("li", { children: [_jsx("kbd", { children: "Ctrl" }), "/", _jsx("kbd", { children: "\u2318" }), " + ", _jsx("kbd", { children: "3" }), " Mobile view"] })] })] })] })] }), _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx(Button, { variant: showGrid ? "default" : "outline", onClick: toggleGrid, children: showGrid ? "Hide grid" : "Show grid" }), _jsx(Input, { type: "number", min: 1, max: 24, value: gridCols, onChange: (e) => setGridCols(Number(e.target.value)), className: "w-16" })] }), _jsx("div", { className: "flex justify-end gap-2", children: locales.map((l) => (_jsx(Button, { variant: locale === l ? "default" : "outline", onClick: () => setLocale(l), children: l.toUpperCase() }, l))) }), progress && (_jsxs("p", { className: "text-sm", children: ["Uploading image\u2026 ", progress.done, "/", progress.total] })), isValid === false && (_jsx("p", { className: "text-sm text-warning", children: "Wrong orientation (needs landscape)" }))] }));
};
export default PageToolbar;
