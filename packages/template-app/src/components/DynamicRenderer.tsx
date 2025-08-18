// packages/template-app/src/components/DynamicRenderer.tsx
("use client");

import NextImage, { ImageProps } from "next/image";
import * as React from "react";

import HeroBanner from "@acme/ui/src/components/cms/blocks/HeroBanner";
import ReviewsCarousel from "@acme/ui/src/components/home/ReviewsCarousel";
import { ValueProps } from "@acme/ui/src/components/home/ValueProps";
import { ProductGrid } from "../../../platform-core/src/components/shop/ProductGrid";

import BlogListing from "@acme/ui/src/components/cms/blocks/BlogListing";
import ContactForm from "@acme/ui/src/components/cms/blocks/ContactForm";
import ContactFormWithMap from "@acme/ui/src/components/cms/blocks/ContactFormWithMap";
import Gallery from "@acme/ui/src/components/cms/blocks/Gallery";
import Testimonials from "@acme/ui/src/components/cms/blocks/Testimonials";
import TestimonialSlider from "@acme/ui/src/components/cms/blocks/TestimonialSlider";
import { Textarea as TextBlock } from "@acme/ui/src/components/atoms/primitives/textarea";

import { PRODUCTS } from "../../../platform-core/src/products";
import type { PageComponent, SKU } from "@acme/types";

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
const registry: Partial<Record<
  PageComponent["type"],
  React.ComponentType<Record<string, unknown>>
>> = {
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
