// packages/template-app/src/components/DynamicRenderer.tsx
("use client");

import NextImage, { ImageProps } from "next/image";
import React from "react";

import HeroBanner from "@/components/cms/blocks/HeroBanner";
import ReviewsCarousel from "@/components/home/ReviewsCarousel";
import { ValueProps } from "@/components/home/ValueProps";
import { ProductGrid } from "@platform-core/src/components/shop/ProductGrid";

import BlogListing from "@/components/cms/blocks/BlogListing";
import ContactForm from "@/components/cms/blocks/ContactForm";
import ContactFormWithMap from "@/components/cms/blocks/ContactFormWithMap";
import Gallery from "@/components/cms/blocks/Gallery";
import Testimonials from "@/components/cms/blocks/Testimonials";
import TestimonialSlider from "@/components/cms/blocks/TestimonialSlider";
import { Textarea as TextBlock } from "@/components/atoms/primitives/textarea";

import { PRODUCTS } from "@platform-core/src/products";
import type { PageComponent, SKU } from "@types";

/* ------------------------------------------------------------------
 * next/image wrapper usable in CMS blocks
 * ------------------------------------------------------------------ */
const CmsImage = React.memo(
  ({
    src,
    alt = "",
    width,
    height,
    ...rest
  }: Omit<ImageProps, "src" | "alt"> & {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  }) => (
    <NextImage src={src} alt={alt} width={width} height={height} {...rest} />
  )
);

/* ------------------------------------------------------------------
 * Registry: block type → React component
 * ------------------------------------------------------------------ */
const registry: Record<
  PageComponent["type"],
  React.ComponentType<Record<string, unknown>>
> = {
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
function DynamicRenderer({ components }: { components: PageComponent[] }) {
  return (
    <>
      {components.map((block) => {
        const Comp = registry[block.type];
        if (!Comp) {
          console.warn(`Unknown component type: ${block.type}`);
          return null;
        }

        const { id, ...props } = block as Record<string, unknown> & {
          id: string;
        };

        if (block.type === "ProductGrid") {
          return (
            <Comp key={id} {...props} skus={PRODUCTS as SKU[]} />
          );
        }

        return <Comp key={id} {...props} />;
      })}
    </>
  );
}

export default React.memo(DynamicRenderer);

/* ------------------------------------------------------------------
 * Named re-exports so other modules can import blocks directly
 * ------------------------------------------------------------------ */
export {
  BlogListing,
  ContactForm,
  ContactFormWithMap,
  Gallery,
  CmsImage as Image,
  Testimonials,
  TestimonialSlider,
  TextBlock as Text,
};
