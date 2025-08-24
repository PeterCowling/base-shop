"use client";

import { jsx as _jsx } from "react/jsx-runtime";
import { ProductCarousel as BaseCarousel, } from "../../organisms/ProductCarousel";
import { PRODUCTS } from "@acme/platform-core/products";
import { useEffect, useState } from "react";
import { fetchCollection } from "./products/fetchCollection";
export function getRuntimeProps() {
    return { products: PRODUCTS };
}
export default function CmsProductCarousel({ skus, collectionId, minItems, maxItems, desktopItems, tabletItems, mobileItems, ...rest }) {
    const [products, setProducts] = useState([]);
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (collectionId) {
                const fetched = await fetchCollection(collectionId);
                if (!cancelled)
                    setProducts(fetched);
            }
            else if (skus) {
                setProducts(skus);
            }
            else {
                setProducts([]);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [collectionId, skus]);
    return (_jsx(BaseCarousel, { products: products, minItems: minItems, maxItems: maxItems, desktopItems: desktopItems, tabletItems: tabletItems, mobileItems: mobileItems, ...rest }));
}
