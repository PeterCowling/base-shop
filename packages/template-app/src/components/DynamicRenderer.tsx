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
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import { cssVars } from "@ui/src/utils/style";
import type { Locale } from "@i18n/locales";
import { ensureLightboxStyles, initLightbox } from "@ui/components/cms";

/* ------------------------------------------------------------------
 * next/image wrapper usable in CMS blocks
 * ------------------------------------------------------------------ */
const CmsImage = React.memo(function CmsImage({
  src,
  alt = "",
  width,
  height,
  cropAspect,
  focalPoint,
  ...rest
}: Omit<ImageProps, "src" | "alt"> & {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  cropAspect?: string;
  focalPoint?: { x: number; y: number };
}) {
  const style: React.CSSProperties | undefined = focalPoint
    ? ({ objectPosition: `${(focalPoint.x * 100).toFixed(2)}% ${(focalPoint.y * 100).toFixed(2)}%` } as React.CSSProperties)
    : undefined;

  if (cropAspect) {
    const [w, h] = cropAspect.split(":");
    const numeric = Number(w) > 0 && Number(h) > 0 ? `${Number(w) / Number(h)}` : undefined;
    return (
      <div
        className="relative w-full overflow-hidden"
        style={numeric ? ({ aspectRatio: numeric } as React.CSSProperties) : undefined}
      >
        <NextImage src={src} alt={alt} fill style={style} className="object-cover" {...rest} />
      </div>
    );
  }

  return <NextImage src={src} alt={alt} width={width} height={height} style={style} {...rest} />;
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
  React.useEffect(() => {
    ensureLightboxStyles();
    initLightbox();
  }, []);
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
          const rawVal = (block as Record<string, unknown>).styles;
          const raw = typeof rawVal === "string" ? rawVal : undefined;
          const parsed = raw ? JSON.parse(String(raw)) : undefined;
          const overrides = parsed as unknown as StyleOverrides | undefined;
          styleVars = cssVars(overrides);
        } catch {
          // ignore invalid style JSON
        }

        const fromBlockHidden = (block as Record<string, unknown>).hiddenBreakpoints;
        const hiddenFromBlock = Array.isArray(fromBlockHidden)
          ? (fromBlockHidden as ("desktop" | "tablet" | "mobile")[])
          : [];
        const hidden = [
          ...hiddenFromBlock,
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
        const orderMobileVal = (block as Record<string, unknown>).orderMobile as unknown;
        const orderMobile = typeof orderMobileVal === "number" ? orderMobileVal : undefined;
        const orderClass = typeof orderMobile === "number" ? `pb-order-mobile-${orderMobile}` : "";
        const stackStrategy = (block as Record<string, unknown>).stackStrategy as string | undefined;
        const stackClass = stackStrategy === "reverse" ? "pb-stack-mobile-reverse" : "";
        const existing = (props as { className?: unknown }).className;
        const existingClass = typeof existing === "string" ? existing : undefined;
        const mergedClassName = [existingClass, stackClass].filter(Boolean).join(" ");

        if (block.type === "ProductGrid") {
          return (
            <div
              key={id}
              className={["pb-scope", hideClasses, orderClass].filter(Boolean).join(" ") || undefined}
              style={{
                ...((styleVars as unknown) as React.CSSProperties),
                fontFamily: styleVars["--font-family"] ? "var(--font-family)" : undefined,
                fontSize:
                  styleVars["--font-size"] ||
                  styleVars["--font-size-desktop"] ||
                  styleVars["--font-size-tablet"] ||
                  styleVars["--font-size-mobile"]
                    ? "var(--font-size)"
                    : undefined,
                lineHeight:
                  styleVars["--line-height"] ||
                  styleVars["--line-height-desktop"] ||
                  styleVars["--line-height-tablet"] ||
                  styleVars["--line-height-mobile"]
                    ? "var(--line-height)"
                    : undefined,
              }}
            >
              <Comp
                {...(props as Record<string, unknown>)}
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
              ...((styleVars as unknown) as React.CSSProperties),
              fontFamily: styleVars["--font-family"] ? "var(--font-family)" : undefined,
              fontSize:
                styleVars["--font-size"] ||
                styleVars["--font-size-desktop"] ||
                styleVars["--font-size-tablet"] ||
                styleVars["--font-size-mobile"]
                  ? "var(--font-size)"
                  : undefined,
              lineHeight:
                styleVars["--line-height"] ||
                styleVars["--line-height-desktop"] ||
                styleVars["--line-height-tablet"] ||
                styleVars["--line-height-mobile"]
                  ? "var(--line-height)"
                  : undefined,
            }}
          >
            <Comp {...(props as Record<string, unknown>)} locale={locale} className={mergedClassName} />
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
