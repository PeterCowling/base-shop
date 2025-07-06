// packages/ui/components/cms/ProductsTable.tsx
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { deleteProduct, duplicateProduct } from "@cms/actions/products.server";
import { useProductFilters } from "@ui/hooks/useProductFilters";
import Link from "next/link";
import { memo, useCallback, useMemo } from "react";
import DataTable from "./DataTable";
import { ProductFilters, ProductRowActions } from "./products";
/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */
function ProductsTableBase({ shop, rows, isAdmin }) {
    const { search, status, setSearch, setStatus, filteredRows } = useProductFilters(rows);
    /* ---------------------------------------------------------------------- */
    /*  Stable action handlers                                                */
    /* ---------------------------------------------------------------------- */
    const handleDuplicate = useCallback((id) => duplicateProduct(shop, id), [shop]);
    const handleDelete = useCallback((id) => {
         
        if (confirm("Delete this product?"))
            deleteProduct(shop, id);
    }, [shop]);
    /* ---------------------------------------------------------------------- */
    /*  Columns                                                               */
    /* ---------------------------------------------------------------------- */
    const columns = useMemo(() => {
        return [
            {
                header: "Title",
                render: (p) => isAdmin ? (_jsx(Link, { href: `/cms/shop/${shop}/products/${p.id}/edit`, className: "underline", children: p.title.en })) : (_jsx("span", { children: p.title.en })),
            },
            {
                header: "SKU",
                width: "10rem",
                render: (p) => p.sku ?? "—",
            },
            {
                header: "Price",
                render: (p) => `${(p.price / 100).toFixed(2)} ${p.currency}`,
            },
            {
                header: "Status",
                render: (p) => p.status,
            },
            {
                header: "Actions",
                width: "12rem",
                render: (p) => (_jsx(ProductRowActions, { shop: shop, product: p, onDuplicate: handleDuplicate, onDelete: handleDelete })),
            },
        ];
    }, [isAdmin, shop, handleDuplicate, handleDelete]);
    /* ---------------------------------------------------------------------- */
    /*  Render                                                                */
    /* ---------------------------------------------------------------------- */
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(ProductFilters, { search: search, status: status, onSearchChange: setSearch, onStatusChange: setStatus }), _jsx(DataTable, { rows: filteredRows, columns: columns, selectable: isAdmin }), " "] }));
}
/* -------------------------------------------------------------------------- */
/*  Export                                                                    */
/* -------------------------------------------------------------------------- */
export default memo(ProductsTableBase);
