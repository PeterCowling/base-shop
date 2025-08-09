"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { getShopFromPath } from "@platform-core/utils/getShopFromPath";
import { replaceShopInPath } from "@platform-core/utils/replaceShopInPath";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "../atoms/shadcn";
export default function ShopSelector() {
    const [shops, setShops] = useState([]);
    const [status, setStatus] = useState("loading");
    const pathname = usePathname() ?? "";
    const router = useRouter();
    useEffect(() => {
        async function fetchShops() {
            try {
                const res = await fetch("/api/shops");
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setShops(data);
                        setStatus("ready");
                        return;
                    }
                }
                setStatus("error");
            }
            catch {
                setStatus("error");
                setShops([]);
            }
        }
        fetchShops();
    }, []);
    const selected = getShopFromPath(pathname);
    function changeShop(value) {
        const search = typeof window === "undefined" ? "" : window.location.search;
        const newPath = replaceShopInPath(pathname, value);
        router.push(`${newPath}${search}`);
    }
    if (status === "loading")
        return _jsx("span", { className: "text-sm", children: "Loading shops\u2026" });
    if (status === "error")
        return _jsx("span", { className: "text-sm text-red-600", children: "Failed to load shops" });
    if (shops.length === 0)
        return (_jsx("span", { className: "text-muted-foreground text-sm", children: "No shops found." }));
    return (_jsxs(Select, { value: selected, onValueChange: changeShop, children: [_jsx(SelectTrigger, { className: "w-36", children: _jsx(SelectValue, { placeholder: "Select shop" }) }), _jsx(SelectContent, { children: shops.map((s) => (_jsx(SelectItem, { value: s, children: s }, s))) })] }));
}
