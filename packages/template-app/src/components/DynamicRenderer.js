import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
// packages/template-app/src/components/DynamicRenderer.tsx
("use client");
import NextImage from "next/image";
import React from "react";
import HeroBanner from "@/components/cms/blocks/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
import { ProductGrid } from "@/components/shop/ProductGrid";
import BlogListing from "@/components/cms/blocks/BlogListing";
import ContactForm from "@/components/cms/blocks/ContactForm";
import ContactFormWithMap from "@/components/cms/blocks/ContactFormWithMap";
import Gallery from "@/components/cms/blocks/Gallery";
import Testimonials from "@/components/cms/blocks/Testimonials";
import TestimonialSlider from "@/components/cms/blocks/TestimonialSlider";
import { Textarea as TextBlock } from "@/components/ui/textarea";
import { PRODUCTS } from "@/lib/products";
/* ------------------------------------------------------------------
 * next/image wrapper usable in CMS blocks
 * ------------------------------------------------------------------ */
const CmsImage = React.memo(({ src, alt = "", width, height, ...rest }) => (_jsx(NextImage, { src: src, alt: alt, width: width, height: height, ...rest })));
/* ------------------------------------------------------------------
 * Registry: block type → React component
 * ------------------------------------------------------------------ */
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
    Image: CmsImage,
    Text: TextBlock,
};
/* ------------------------------------------------------------------
 * DynamicRenderer
 * ------------------------------------------------------------------ */
function DynamicRenderer({ components }) {
    return (_jsx(_Fragment, { children: components.map((block) => {
            const Comp = registry[block.type];
            if (!Comp) {
                console.warn(`Unknown component type: ${block.type}`);
                return null;
            }
            /* Runtime props for specific blocks */
            if (block.type === "ProductGrid") {
                return _jsx(Comp, { skus: PRODUCTS }, block.id);
            }
            const props = block.props ?? {};
            return _jsx(Comp, { ...props }, block.id);
        }) }));
}
export default React.memo(DynamicRenderer);
/* ------------------------------------------------------------------
 * Named re-exports so other modules can import blocks directly
 * ------------------------------------------------------------------ */
export { BlogListing, ContactForm, ContactFormWithMap, Gallery, CmsImage as Image, Testimonials, TestimonialSlider, TextBlock as Text, };
