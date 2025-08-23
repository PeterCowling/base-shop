"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { ProductGrid as BaseGrid } from "@acme/platform-core/components/shop/ProductGrid";
import { PRODUCTS } from "@acme/platform-core/products";
import { useEffect, useState } from "react";
import { fetchCollection } from "./products/fetchCollection";
export default function ProductGrid({ skus, collectionId, columns, minItems, maxItems, desktopItems, tabletItems, mobileItems, className, }) {
    const [items, setItems] = useState(skus ?? []);
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (collectionId) {
                const fetched = await fetchCollection(collectionId);
                if (!cancelled)
                    setItems(fetched);
            }
            else {
                setItems(skus ?? []);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [collectionId, skus]);
    return (_jsx(BaseGrid, { skus: items, columns: columns, minItems: minItems, maxItems: maxItems, desktopItems: desktopItems, tabletItems: tabletItems, mobileItems: mobileItems, className: className }));
}
export function getRuntimeProps() {
    return { skus: PRODUCTS };
}
