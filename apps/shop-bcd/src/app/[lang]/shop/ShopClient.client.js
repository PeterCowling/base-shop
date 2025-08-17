// apps/shop-bcd/src/app/[lang]/shop/ShopClient.tsx
"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ShopClient;
var FilterBar_1 = require("@platform-core/components/shop/FilterBar");
var ProductGrid_1 = require("@platform-core/components/shop/ProductGrid");
var react_1 = require("react");
var navigation_1 = require("next/navigation");
function ShopClient(_a) {
    var skus = _a.skus;
    var searchParams = (0, navigation_1.useSearchParams)();
    var router = (0, navigation_1.useRouter)();
    var pathname = (0, navigation_1.usePathname)();
    var _b = (0, react_1.useState)(function () { var _a; return (_a = searchParams.get("q")) !== null && _a !== void 0 ? _a : ""; }), query = _b[0], setQuery = _b[1];
    var _c = (0, react_1.useState)(function () {
        var init = {};
        var size = searchParams.get("size");
        var color = searchParams.get("color");
        var maxPrice = searchParams.get("maxPrice");
        if (size)
            init.size = size;
        if (color)
            init.color = color;
        if (maxPrice) {
            var n = Number(maxPrice);
            if (!Number.isNaN(n))
                init.maxPrice = n;
        }
        return init;
    }), filters = _c[0], setFilters = _c[1];
    var synced = (0, react_1.useRef)(false);
    var sizes = (0, react_1.useMemo)(function () { return Array.from(new Set(skus.flatMap(function (p) { return p.sizes; }))).sort(); }, [skus]);
    var colors = (0, react_1.useMemo)(function () { return Array.from(new Set(skus.map(function (p) { return p.slug.split("-")[0]; }))).sort(); }, [skus]);
    var defs = [
        { name: "size", label: "Size", type: "select", options: sizes },
        { name: "color", label: "Color", type: "select", options: colors },
        { name: "maxPrice", label: "Max Price", type: "number" },
    ];
    var visible = (0, react_1.useMemo)(function () {
        return skus.filter(function (p) {
            if (query && !p.title.toLowerCase().includes(query.toLowerCase())) {
                return false;
            }
            if (filters.size && !p.sizes.includes(filters.size))
                return false;
            if (filters.color && !p.slug.startsWith(filters.color))
                return false;
            if (typeof filters.maxPrice === "number" && p.price > filters.maxPrice) {
                return false;
            }
            return true;
        });
    }, [filters, query, skus]);
    (0, react_1.useEffect)(function () {
        if (!synced.current) {
            synced.current = true;
            return;
        }
        var params = new URLSearchParams();
        if (query)
            params.set("q", query);
        Object.entries(filters).forEach(function (_a) {
            var k = _a[0], v = _a[1];
            if (v !== undefined && v !== "")
                params.set(k, String(v));
        });
        var search = params.toString();
        router.push("".concat(pathname).concat(search ? "?".concat(search) : ""));
    }, [filters, pathname, query, router]);
    return (<div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-4 text-3xl font-bold">Shop</h1>
      <input aria-label="Search products" type="search" value={query} onChange={function (e) { return setQuery(e.target.value); }} placeholder="Search products" className="mb-4 w-full max-w-xs border rounded px-2 py-1"/>
      <FilterBar_1.default definitions={defs} values={filters} onChange={setFilters}/>
      <ProductGrid_1.ProductGrid skus={visible}/>
    </div>);
}
