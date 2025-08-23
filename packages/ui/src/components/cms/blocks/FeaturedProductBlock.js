"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Image from "next/image";
import { useEffect, useState } from "react";
import AddToCartButton from "@acme/platform-core/components/shop/AddToCartButton.client";
import { PRODUCTS } from "@acme/platform-core/products";
import { fetchCollection } from "./products/fetchCollection";
import { Price } from "../../atoms/Price";
import { ProductVariantSelector } from "../../organisms/ProductVariantSelector";
export function getRuntimeProps() {
    return { sku: PRODUCTS[0] };
}
export default function FeaturedProductBlock({ sku, collectionId, }) {
    const [product, setProduct] = useState(sku ?? null);
    const [size, setSize] = useState();
    const [quantity, setQuantity] = useState(1);
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            if (collectionId) {
                const fetched = await fetchCollection(collectionId);
                if (!cancelled)
                    setProduct(fetched[0] ?? null);
            }
            else {
                setProduct(sku ?? null);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [collectionId, sku]);
    if (!product)
        return null;
    const media = product.media?.[0];
    return (_jsxs("div", { className: "flex flex-col gap-4", children: [media?.url && (_jsx("div", { className: "relative aspect-square w-full", children: media.type === "image" ? (_jsx(Image, { src: media.url, alt: media.altText ?? product.title ?? "", fill: true, sizes: "(min-width: 768px) 50vw, 100vw", className: "rounded-md object-cover" })) : (_jsx("video", { src: media.url, className: "h-full w-full rounded-md object-cover", muted: true, playsInline: true })) })), _jsx("h3", { className: "text-xl font-semibold", children: product.title }), _jsx(Price, { amount: product.price ?? 0, className: "text-lg font-medium" }), _jsx(ProductVariantSelector, { sizes: product.sizes, selectedSize: size, onSizeChange: setSize, quantity: quantity, onQuantityChange: setQuantity }), _jsx(AddToCartButton, { sku: product, size: size, quantity: quantity, disabled: product.sizes?.length > 0 && !size })] }));
}
