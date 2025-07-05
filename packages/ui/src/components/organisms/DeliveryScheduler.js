import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn } from "../../utils/cn";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../ui/select";
export function DeliveryScheduler({ className, onChange, ...props }) {
    const [mode, setMode] = React.useState("delivery");
    const [date, setDate] = React.useState("");
    const [time, setTime] = React.useState("");
    const emitChange = React.useCallback((next) => {
        onChange?.(next);
    }, [onChange]);
    const handleMode = (value) => {
        setMode(value);
        emitChange({ mode: value, date, time });
    };
    const handleDate = (value) => {
        setDate(value);
        emitChange({ mode, date: value, time });
    };
    const handleTime = (value) => {
        setTime(value);
        emitChange({ mode, date, time: value });
    };
    return (_jsxs("div", { className: cn("space-y-4", className), ...props, children: [_jsxs("div", { children: [_jsx("label", { className: "mb-1 block text-sm font-medium", children: "Mode" }), _jsxs(Select, { value: mode, onValueChange: handleMode, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select mode" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "delivery", children: "Delivery" }), _jsx(SelectItem, { value: "pickup", children: "Pickup" })] })] })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm", children: ["Date", _jsx(Input, { type: "date", value: date, onChange: (e) => handleDate(e.target.value) })] }), _jsxs("label", { className: "flex flex-col gap-1 text-sm", children: ["Time", _jsx(Input, { type: "time", value: time, onChange: (e) => handleTime(e.target.value) })] })] }));
}
