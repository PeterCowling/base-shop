"use client";
import { useMemo, useState } from "react";
export function useProductFilters(rows) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const availableLocales = useMemo(() => {
        const set = new Set();
        rows.forEach((p) => {
            if (typeof p.title === "object") {
                Object.keys(p.title).forEach((k) => set.add(k));
            }
        });
        return Array.from(set);
    }, [rows]);
    const normalisedQuery = useMemo(() => search.trim().toLowerCase(), [search]);
    const filteredRows = useMemo(() => {
        return rows.filter((p) => {
            const matchesTitle = typeof p.title === "string"
                ? p.title.toLowerCase().includes(normalisedQuery)
                : availableLocales.some((loc) => {
                    const t = p.title[loc] ?? "";
                    return t.toLowerCase().includes(normalisedQuery);
                });
            const sku = p.sku ?? "";
            const matchesSku = sku.toLowerCase().includes(normalisedQuery);
            const matchesQuery = normalisedQuery.length === 0 || matchesTitle || matchesSku;
            const matchesStatus = status === "all" || p.status === status;
            return matchesQuery && matchesStatus;
        });
    }, [rows, normalisedQuery, status, availableLocales]);
    return { search, status, setSearch, setStatus, filteredRows };
}
