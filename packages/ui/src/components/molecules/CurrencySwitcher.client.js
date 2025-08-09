"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../atoms/primitives";
const OPTIONS = ["EUR", "USD", "GBP"];
export default function CurrencySwitcher() {
    const [currency, setCurrency] = useCurrency();
    return (_jsxs(Select, { value: currency, onValueChange: (v) => setCurrency(v), children: [_jsx(SelectTrigger, { className: "w-24", children: _jsx(SelectValue, { "aria-label": currency, children: currency }) }), _jsx(SelectContent, { children: OPTIONS.map((c) => (_jsx(SelectItem, { value: c, children: c }, c))) })] }));
}
