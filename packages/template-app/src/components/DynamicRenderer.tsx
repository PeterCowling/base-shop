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

import { PRODUCTS } from "@platform-core/products/index";
import type { PageComponent, SKU, HistoryState } from "@acme/types";
import { cssVars } from "@ui/src/utils/style";
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
  editor,
}: {
  components: PageComponent[];
  locale: Locale;
  editor?: HistoryState["editor"];
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

        // Inline CSS variables based on style overrides
        let styleVars: Record<string, string> = {};
        try {
          const raw = (block as any).styles as string | undefined;
          const overrides = raw ? (JSON.parse(String(raw)) as any) : undefined;
          styleVars = cssVars(overrides);
        } catch {
          // ignore invalid style JSON
        }

        const hidden = [
          ...((((block as any).hiddenBreakpoints as ("desktop"|"tablet"|"mobile")[] | undefined) ?? [])),
          ...((editor?.[id]?.hidden ?? []) as ("desktop" | "tablet" | "mobile")[]),
        ];
        const hideClasses = [
          hidden.includes("desktop") ? "pb-hide-desktop" : "",
          hidden.includes("tablet") ? "pb-hide-tablet" : "",
          hidden.includes("mobile") ? "pb-hide-mobile" : "",
        ]
          .filter(Boolean)
          .join(" ");

        // Optional export-time props
        const orderMobile = (typeof (block as any).orderMobile === "number" ? ((block as any).orderMobile as number) : undefined);
        const orderClass = typeof orderMobile === "number" ? `pb-order-mobile-${orderMobile}` : "";
        const stackStrategy = (block as any).stackStrategy as string | undefined;
        const stackClass = stackStrategy === "reverse" ? "pb-stack-mobile-reverse" : "";
        const existing = (props as any).className as string | undefined;
        const mergedClassName = [existing, stackClass].filter(Boolean).join(" ");

        if (block.type === "ProductGrid") {
          return (
            <div
              key={id}
              className={["pb-scope", hideClasses, orderClass].filter(Boolean).join(" ") || undefined}
              style={{
                ...(styleVars as any),
                fontFamily: (styleVars as any)["--font-family"] ? "var(--font-family)" : undefined,
                fontSize:
                  (styleVars as any)["--font-size"] ||
                  (styleVars as any)["--font-size-desktop"] ||
                  (styleVars as any)["--font-size-tablet"] ||
                  (styleVars as any)["--font-size-mobile"]
                    ? "var(--font-size)"
                    : undefined,
                lineHeight:
                  (styleVars as any)["--line-height"] ||
                  (styleVars as any)["--line-height-desktop"] ||
                  (styleVars as any)["--line-height-tablet"] ||
                  (styleVars as any)["--line-height-mobile"]
                    ? "var(--line-height)"
                    : undefined,
              }}
            >
              <Comp
                {...props}
                skus={PRODUCTS as SKU[]}
                locale={locale}
                className={mergedClassName}
              />
            </div>
          );
        }

        return (
          <div
            key={id}
            className={["pb-scope", hideClasses, orderClass].filter(Boolean).join(" ") || undefined}
            style={{
              ...(styleVars as any),
              fontFamily: (styleVars as any)["--font-family"] ? "var(--font-family)" : undefined,
              fontSize:
                (styleVars as any)["--font-size"] ||
                (styleVars as any)["--font-size-desktop"] ||
                (styleVars as any)["--font-size-tablet"] ||
                (styleVars as any)["--font-size-mobile"]
                  ? "var(--font-size)"
                  : undefined,
              lineHeight:
                (styleVars as any)["--line-height"] ||
                (styleVars as any)["--line-height-desktop"] ||
                (styleVars as any)["--line-height-tablet"] ||
                (styleVars as any)["--line-height-mobile"]
                  ? "var(--line-height)"
                  : undefined,
            }}
          >
            <Comp {...(props as any)} locale={locale} className={mergedClassName} />
          </div>
        );
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
