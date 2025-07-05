// apps/shop-bcd/src/components/DynamicRenderer.tsx
"use client";
import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import BlogListing from "@/components/cms/blocks/BlogListing";
import ContactForm from "@/components/cms/blocks/ContactForm";
import ContactFormWithMap from "@/components/cms/blocks/ContactFormWithMap";
import Gallery from "@/components/cms/blocks/Gallery";
import Testimonials from "@/components/cms/blocks/Testimonials";
import TestimonialSlider from "@/components/cms/blocks/TestimonialSlider";
import HeroBanner from "@/components/home/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { PRODUCTS } from "@/lib/products";
const registry = {
    HeroBanner,
    ValueProps,
    ReviewsCarousel,
    ProductGrid,
    Gallery,
    ContactForm,
    ContactFormWithMap,
    BlogListing,
    Testimonials,
    TestimonialSlider,
};
export default function DynamicRenderer({ components, }) {
    return (_jsx(_Fragment, { children: components.map((c) => {
            const Comp = registry[c.type];
            if (!Comp) {
                console.warn(`Unknown component type: ${c.type}`);
                return null;
            }
            switch (c.type) {
                case "ProductGrid":
                    return (_jsx("div", { style: { width: c.width, height: c.height }, children: _jsx(Comp, { skus: PRODUCTS }) }, c.id));
                default:
                    return (_jsx("div", { style: { width: c.width, height: c.height }, children: _jsx(Comp, {}) }, c.id));
            }
        }) }));
}
