import { jsx as _jsx } from "react/jsx-runtime";
// apps/shop-bcd/src/app/[lang]/product/[slug]/page.tsx
import { getProductBySlug } from "@/lib/products";
import { LOCALES } from "@types";
import { notFound } from "next/navigation";
import PdpClient from "./PdpClient.client";
export async function generateStaticParams() {
    return LOCALES.flatMap((lang) => ["green-sneaker", "sand-sneaker", "black-sneaker"].map((slug) => ({
        lang,
        slug,
    })));
}
export const revalidate = 60;
export function generateMetadata({ params, }) {
    const product = getProductBySlug(params.slug);
    return {
        title: product ? `${product.title} · Base-Shop` : "Product not found",
    };
}
export default function ProductDetailPage({ params, }) {
    const product = getProductBySlug(params.slug);
    if (!product)
        return notFound();
    /* ⬇️  Only data, no event handlers */
    return _jsx(PdpClient, { product: product });
}
