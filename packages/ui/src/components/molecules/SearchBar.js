"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Input } from "../atoms/shadcn";
export function SearchBar({ suggestions, onSelect, placeholder = "Search…", }) {
    const [query, setQuery] = useState("");
    const [matches, setMatches] = useState([]);
    useEffect(() => {
        if (!query) {
            setMatches([]);
            return;
        }
        const q = query.toLowerCase();
        setMatches(suggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 5));
    }, [query, suggestions]);
    const handleSelect = (value) => {
        setQuery(value);
        setMatches([]);
        onSelect?.(value);
    };
    return (_jsxs("div", { className: "relative w-full max-w-sm", children: [_jsx(Input, { type: "search", value: query, onChange: (e) => setQuery(e.target.value), placeholder: placeholder, className: "pr-8" }), _jsx(MagnifyingGlassIcon, { className: "text-muted-foreground pointer-events-none absolute top-2 right-2 h-4 w-4" }), matches.length > 0 && (_jsx("ul", { className: "bg-background absolute z-10 mt-1 w-full rounded-md border shadow", children: matches.map((m) => (_jsx("li", { onMouseDown: () => handleSelect(m), className: "hover:bg-accent hover:text-accent-foreground cursor-pointer px-3 py-1", children: m }, m))) }))] }));
}
