"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/style";
import { Input } from "../atoms/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../atoms/primitives/select";
export function DeliveryScheduler({ className, onChange, regions, windows, ...props }) {
    const [mode, setMode] = React.useState("delivery");
    const [date, setDate] = React.useState("");
    const [region, setRegion] = React.useState("");
    const [win, setWin] = React.useState("");
    const emitChange = React.useCallback((next) => {
        onChange?.(next);
    }, [onChange]);
    const handleMode = (value) => {
        setMode(value);
        emitChange({ mode: value, date, region, window: win });
    };
    const handleDate = (value) => {
        setDate(value);
        emitChange({ mode, date: value, region, window: win });
    };
    const handleTime = (value) => {
        setWin(value);
        emitChange({ mode, date, region, window: value });
    };
    const handleRegion = (value) => {
        setRegion(value);
        emitChange({ mode, date, region: value, window: win });
    };
    return (_jsxs("div", { className: cn("space-y-4", className), ...props, children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium", children: "Mode" }), _jsxs(Select, { value: mode, onValueChange: handleMode, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select mode" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "delivery", children: "Delivery" }), _jsx(SelectItem, { value: "pickup", children: "Pickup" })] })] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm", children: ["Date", _jsx(Input, { type: "date", value: date, onChange: (e) => handleDate(e.target.value) })] }), regions && regions.length ? (_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium", children: "Region" }), _jsxs(Select, { value: region, onValueChange: handleRegion, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select region" }) }), _jsx(SelectContent, { children: regions.map((r) => (_jsx(SelectItem, { value: r, children: r }, r))) })] })] })) : null, _jsxs("label", { className: "flex flex-col gap-1 text-sm", children: [windows && windows.length ? "Window" : "Time", windows && windows.length ? (_jsxs(Select, { value: win, onValueChange: handleTime, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select window" }) }), _jsx(SelectContent, { children: windows.map((w) => (_jsx(SelectItem, { value: w, children: w }, w))) })] })) : (_jsx(Input, { type: "time", value: win, onChange: (e) => handleTime(e.target.value) }))] })] }));
}
