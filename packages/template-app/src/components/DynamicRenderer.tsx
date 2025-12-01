// packages/template-app/src/components/DynamicRenderer.tsx
"use client";

import NextImage, { type ImageProps } from "next/image";
import * as React from "react";

import HeroBanner from "@ui/components/cms/blocks/HeroBanner";
import ReviewsCarousel from "@ui/components/home/ReviewsCarousel";
import { ValueProps } from "@ui/components/home/ValueProps";
import { ProductGrid } from "@platform-core/components/shop/ProductGrid";

import BlogListing from "@ui/components/cms/blocks/BlogListing";
import ContactForm from "@ui/components/cms/blocks/ContactForm";
import ContactFormWithMap from "@ui/components/cms/blocks/ContactFormWithMap";
import Gallery from "@ui/components/cms/blocks/Gallery";
import HeaderCart from "@ui/components/cms/blocks/HeaderCart";
import Testimonials from "@ui/components/cms/blocks/Testimonials";
import TestimonialSlider from "@ui/components/cms/blocks/TestimonialSlider";
import { Textarea as TextBlock } from "@ui/components/atoms/primitives/textarea";

import { PRODUCTS } from "@platform-core/products/index";
import type { PageComponent, HistoryState } from "@acme/page-builder-core";
import type { SKU } from "@acme/types";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import { cssVars, extractTextThemes, applyTextThemeToOverrides } from "@ui";
import type { Locale } from "@i18n/locales";
import { ensureLightboxStyles, initLightbox } from "@ui/components/cms";
import Section from "@ui/components/cms/blocks/Section";
import { buildBlockRegistry, coreBlockDescriptors, type BlockTypeId } from "@acme/page-builder-core";

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
type BlockComponent = React.ComponentType<Record<string, unknown>>;

const { registry } = buildBlockRegistry<BlockComponent>(coreBlockDescriptors, [
  { type: "HeroBanner", entry: HeroBanner as BlockComponent },
  { type: "ValueProps", entry: ValueProps as BlockComponent },
  { type: "ReviewsCarousel", entry: ReviewsCarousel as BlockComponent },
  {
    type: "ProductGrid",
    entry: ProductGrid as unknown as BlockComponent,
  },
  { type: "Gallery", entry: Gallery as BlockComponent },
  { type: "ContactForm", entry: ContactForm as BlockComponent },
  {
    type: "ContactFormWithMap",
    entry: ContactFormWithMap as BlockComponent,
  },
  { type: "BlogListing", entry: BlogListing as BlockComponent },
  { type: "Testimonials", entry: Testimonials as BlockComponent },
  {
    type: "TestimonialSlider",
    entry: TestimonialSlider as BlockComponent,
  },
  {
    type: "Image",
    entry: CmsImage as unknown as BlockComponent,
  },
  { type: "HeaderCart", entry: HeaderCart as BlockComponent },
  { type: "Text", entry: TextBlock as BlockComponent },
  // Minimal mapping so Sections render in preview/runtime
  { type: "Section", entry: Section as unknown as BlockComponent },
]);

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

  // Build a cache of text themes from CSS variables at runtime (client-side only)
  const textThemes = React.useMemo(() => {
    if (typeof window === "undefined") return [] as ReturnType<typeof extractTextThemes>;
    try {
      const styles = getComputedStyle(document.documentElement);
      const tokens: Record<string, string> = {};
      for (let i = 0; i < styles.length; i++) {
        const prop = styles[i];
        if (prop && prop.startsWith("--")) {
          tokens[prop] = styles.getPropertyValue(prop);
        }
      }
      return extractTextThemes(tokens);
    } catch {
      return [] as ReturnType<typeof extractTextThemes>;
    }
  }, []);

  const presetToMinHeight = (preset: string | undefined): string | undefined => {
    switch (preset) {
      case "compact":
        return "320px";
      case "standard":
        return "560px";
      case "tall":
        return "720px";
      case "full":
        return "100dvh"; // viewport-height aware
      case "auto":
      default:
        return undefined;
    }
  };
  return (
    <>
      {components.map((block) => {
        const Comp = registry[block.type as BlockTypeId];
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

        // Optional Section-specific container vars
        const sectionVars: React.CSSProperties = (() => {
          if (block.type !== "Section") return {};
          const b = block as unknown as Record<string, unknown>;
          const minH = (b.minHeight as string | undefined) || presetToMinHeight(b.heightPreset as string | undefined);
          const vars: React.CSSProperties = {};
          if (minH) vars.minHeight = minH;
          const themeId = b.textTheme as string | undefined;
          if (themeId && textThemes.length) {
            const theme = textThemes.find((t) => t.id === themeId);
            if (theme) {
              try {
                const overrides = applyTextThemeToOverrides(undefined, theme);
                const tv = cssVars(overrides);
                Object.assign(vars, tv);
                // Ensure inheritable properties apply
                if (tv["--font-family"]) vars.fontFamily = "var(--font-family)";
                if (tv["--font-size"] || tv["--font-size-desktop"] || tv["--font-size-tablet"] || tv["--font-size-mobile"]) {
                  vars.fontSize = "var(--font-size)";
                }
                if (tv["--line-height"] || tv["--line-height-desktop"] || tv["--line-height-tablet"] || tv["--line-height-mobile"]) {
                  vars.lineHeight = "var(--line-height)";
                }
              } catch {}
            }
          }
          return vars;
        })();

        // For Section blocks, avoid leaking builder-only props to DOM via the Section component.
        const sanitizedProps: Record<string, unknown> = (() => {
          if (block.type !== "Section") return (props as Record<string, unknown>);
          const {
            // builder/runtime-only props that should not hit the DOM
            heightPreset: _heightPreset,
            minHeight: _minHeight,
            textTheme: _textTheme,
            hiddenBreakpoints: _hiddenBreakpoints,
            orderMobile: _orderMobile,
            stackStrategy: _stackStrategy,
            styles: _styles,
            ...restSectionProps
          } = (props as Record<string, unknown>);
          return restSectionProps;
        })();

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
              ...(sectionVars as React.CSSProperties),
            }}
          >
            <Comp {...sanitizedProps} locale={locale} className={mergedClassName} />
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
