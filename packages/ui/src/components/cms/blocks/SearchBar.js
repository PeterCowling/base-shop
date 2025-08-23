"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Input } from "../../atoms/shadcn";
import { getShopFromPath } from "@acme/platform-core/utils";
export default function SearchBar({ placeholder = "Search products…", limit = 5, }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }
        const controller = new AbortController();
        const load = async () => {
            try {
                const origin = typeof window !== "undefined" ? window.location.origin : "";
                const url = new URL("/api/products", origin);
                url.searchParams.set("q", query);
                const shop = getShopFromPath(typeof window !== "undefined" ? window.location.pathname : "");
                if (shop)
                    url.searchParams.set("shop", shop);
                const res = await fetch(url.toString(), { signal: controller.signal });
                const data = await res.json();
                setResults(data.slice(0, limit));
            }
            catch {
                // ignore
            }
        };
        load();
        return () => controller.abort();
    }, [query, limit]);
    const handleSelect = (r) => {
        setQuery(r.title);
        setResults([]);
    };
    return (_jsxs("div", { className: "relative w-full max-w-sm", children: [_jsx(Input, { type: "search", value: query, onChange: (e) => setQuery(e.target.value), placeholder: placeholder, className: "pr-8" }), _jsx(MagnifyingGlassIcon, { className: "text-muted-foreground pointer-events-none absolute top-2 right-2 h-4 w-4", "data-token": "--color-muted-fg" }), results.length > 0 && (_jsx("ul", { className: "bg-background absolute z-10 mt-1 w-full rounded-md border shadow", "data-token": "--color-bg", children: results.map((r) => (_jsx("li", { onMouseDown: () => handleSelect(r), className: "text-fg hover:bg-accent hover:text-accent-foreground cursor-pointer px-3 py-1", "data-token": "--color-fg", children: r.title }, r.slug))) }))] }));
}
