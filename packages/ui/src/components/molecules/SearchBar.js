"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useEffect, useId, useState } from "react";
import { Input } from "../atoms/shadcn";
export function SearchBar({ suggestions, onSelect, onSearch, placeholder = "Search…", label, query: initialQuery = "", }) {
    const [query, setQuery] = useState(initialQuery);
    const [matches, setMatches] = useState([]);
    const [isSelecting, setIsSelecting] = useState(false);
    const [focused, setFocused] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputId = useId();
    useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);
    useEffect(() => {
        if (isSelecting || !focused) {
            setMatches([]);
            setHighlightedIndex(-1);
            return;
        }
        if (!query) {
            setMatches([]);
            setHighlightedIndex(-1);
            return;
        }
        const q = query.toLowerCase();
        const nextMatches = suggestions
            .filter((s) => s.toLowerCase().includes(q))
            .slice(0, 5);
        setMatches(nextMatches);
        setHighlightedIndex(-1);
    }, [query, suggestions, isSelecting, focused]);
    const handleSelect = (value) => {
        setIsSelecting(true);
        setQuery(value);
        setMatches([]);
        onSelect?.(value);
    };
    return (_jsxs("div", { className: "relative w-full max-w-sm", children: [_jsx("label", { htmlFor: inputId, className: "sr-only", children: label }), _jsx(Input, { id: inputId, type: "search", "aria-label": label, value: query, onChange: (e) => setQuery(e.target.value), onKeyDown: (e) => {
                    if (e.key === "ArrowDown") {
                        e.preventDefault();
                        if (matches.length > 0) {
                            setHighlightedIndex((prev) => (prev + 1) % matches.length);
                        }
                    }
                    else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        if (matches.length > 0) {
                            setHighlightedIndex((prev) => (prev - 1 + matches.length) % matches.length);
                        }
                    }
                    else if (e.key === "Enter") {
                        if (highlightedIndex >= 0 && matches[highlightedIndex]) {
                            e.preventDefault();
                            handleSelect(matches[highlightedIndex]);
                        }
                        else {
                            setMatches([]);
                            onSearch?.(query);
                        }
                    }
                }, onFocus: () => setFocused(true), onBlur: () => {
                    setFocused(false);
                    if (isSelecting) {
                        setIsSelecting(false);
                        return;
                    }
                    onSearch?.(query);
                }, placeholder: placeholder, className: "pr-8" }), _jsx(MagnifyingGlassIcon, { className: "text-muted-foreground pointer-events-none absolute top-2 right-2 h-4 w-4" }), matches.length > 0 && (_jsx("ul", { role: "listbox", className: "bg-background absolute z-10 mt-1 w-full rounded-md border shadow", children: matches.map((m, i) => (_jsx("li", { id: `${inputId}-option-${i}`, role: "option", "aria-selected": i === highlightedIndex, onMouseDown: () => handleSelect(m), className: `text-fg hover:bg-accent hover:text-accent-foreground cursor-pointer px-3 py-1 ${i === highlightedIndex
                        ? "bg-accent text-accent-foreground"
                        : ""}`, children: m }, m))) }))] }));
}
