// packages/template-app/src/components/DynamicRenderer.tsx
"use client";

import NextImage, { ImageProps } from "next/image";
import * as React from "react";

import HeroBanner from "@ui/components/cms/blocks/HeroBanner";
import ReviewsCarousel from "@ui/components/home/ReviewsCarousel";
import { ValueProps } from "@ui/components/home/ValueProps";
import { ProductGrid } from "@platform-core/components/shop/ProductGrid";

import BlogListing from "@ui/components/cms/blocks/BlogListing";
import ContactForm from "@ui/components/cms/blocks/ContactForm";
import ContactFormWithMap from "@ui/components/cms/blocks/ContactFormWithMap";
import Gallery from "@ui/components/cms/blocks/Gallery";
import Testimonials from "@ui/components/cms/blocks/Testimonials";
import TestimonialSlider from "@ui/components/cms/blocks/TestimonialSlider";
import { Textarea as TextBlock } from "@ui/components/atoms/primitives/textarea";

import { PRODUCTS } from "@platform-core/products";
import type { PageComponent, SKU } from "@acme/types";
import type { Locale } from "@i18n/locales";

/* ------------------------------------------------------------------
 * next/image wrapper usable in CMS blocks
 * ------------------------------------------------------------------ */
const CmsImage = React.memo(function CmsImage({
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
}) {
  return <NextImage src={src} alt={alt} width={width} height={height} {...rest} />;
});

/* ------------------------------------------------------------------
 * Registry: block type → React component
 * ------------------------------------------------------------------ */
const registry: Partial<
  Record<PageComponent["type"], React.ComponentType<Record<string, unknown>>>
> = {
  HeroBanner,
  ValueProps,
  ReviewsCarousel,
  ProductGrid: (ProductGrid as unknown as React.ComponentType<Record<string, unknown>>),
  Gallery,
  ContactForm,
  ContactFormWithMap,
  BlogListing,
  Testimonials,
  TestimonialSlider,
  Image: (CmsImage as unknown as React.ComponentType<Record<string, unknown>>),
  Text: TextBlock,
};

/* ------------------------------------------------------------------
 * DynamicRenderer
 * ------------------------------------------------------------------ */
function DynamicRenderer({
  components,
  locale,
}: {
  components: PageComponent[];
  locale: Locale;
}) {
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
            <Comp
              key={id}
              {...props}
              skus={PRODUCTS as SKU[]}
              locale={locale}
            />
          );
        }

        return <Comp key={id} {...props} locale={locale} />;
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
