// packages/ui/src/components/DynamicRenderer.tsx

"use client";

import { blockRegistry, type BlockType } from "./cms/blocks";
import type { BlockRegistryEntry } from "./cms/blocks/types";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
import type { CSSProperties, ReactNode } from "react";
import { useEffect } from "react";
import { ensureScrollStyles, ensureAnimationStyles, initScrollEffects } from "./cms/page-builder/scrollEffects";
import { initTimelines } from "./cms/page-builder/timeline";
import { initLottie } from "./cms/page-builder/lottie";
import { ensureLightboxStyles, initLightbox } from "./cms/lightbox";
import type { HistoryState } from "@acme/types";
import { cssVars } from "../utils/style";

export default function DynamicRenderer({
  components,
  locale,
  runtimeData,
  editor,
}: {
  components: PageComponent[];
  locale: Locale;
  runtimeData?: Partial<Record<BlockType, Record<string, unknown>>>;
  /** Optional editor metadata map (builder-only flags) */
  editor?: HistoryState["editor"];
}) {
  useEffect(() => {
    ensureScrollStyles();
    ensureAnimationStyles();
    initScrollEffects();
    initTimelines();
    initLottie();
    ensureLightboxStyles();
    initLightbox();
  }, []);

  const renderBlock = (block: PageComponent): ReactNode => {
    // Skip rendering when hidden has been decorated for this viewport
    const blockRecord = block as Record<string, unknown>;
    if (blockRecord.hidden === true) return null;
    const entry = blockRegistry[block.type as BlockType];
    if (!entry) {
      console.warn(`Unknown component type: ${block.type}`);
      return null;
    }

    const { component: Comp, getRuntimeProps } =
      entry as BlockRegistryEntry<Record<string, unknown>>;

    const {
      id,
      type: _type,
      width,
      height,
      margin,
      padding,
      position,
      top,
      left,
      children: childBlocks,
      ...rest
    } = block as PageComponent & { children?: PageComponent[] };

    // Inline CSS variables based on style overrides
    let styleVars: CSSProperties = {};
    try {
      const raw = (blockRecord.styles as string | undefined) ?? "";
      const overrides = raw ? (JSON.parse(String(raw)) as any) : undefined;
      const vars = cssVars(overrides);
      styleVars = vars as CSSProperties;
    } catch {
      // ignore invalid style JSON
    }

    const style: CSSProperties = {
      width,
      height,
      margin,
      padding,
      position,
      top,
      left,
      ...(typeof blockRecord.zIndex === "number" ? { zIndex: blockRecord.zIndex as number } : {}),
      ...styleVars,
      // Apply inheritable typography props using CSS variables
      fontFamily: (styleVars as any)["--font-family"] ? ("var(--font-family)" as any) : undefined,
      fontSize: (styleVars as any)["--font-size"] || (styleVars as any)["--font-size-desktop"] || (styleVars as any)["--font-size-tablet"] || (styleVars as any)["--font-size-mobile"] ? ("var(--font-size)" as any) : undefined,
      lineHeight: (styleVars as any)["--line-height"] || (styleVars as any)["--line-height-desktop"] || (styleVars as any)["--line-height-tablet"] || (styleVars as any)["--line-height-mobile"] ? ("var(--line-height)" as any) : undefined,
    };

    // Per-breakpoint visibility classes from editor metadata (if provided)
    const hidden = [
      ...(((blockRecord.hiddenBreakpoints as ("desktop"|"tablet"|"mobile")[] | undefined) ?? [])),
      ...((editor?.[id]?.hidden ?? []) as ("desktop" | "tablet" | "mobile")[]),
    ];
    const hideClasses = [
      hidden.includes("desktop") ? "pb-hide-desktop" : "",
      hidden.includes("tablet") ? "pb-hide-tablet" : "",
      hidden.includes("mobile") ? "pb-hide-mobile" : "",
    ]
      .filter(Boolean)
      .join(" ");

    // Optional deterministic mobile order (generated at export time)
    const orderMobile = (typeof (blockRecord as any).orderMobile === "number"
      ? ((blockRecord as any).orderMobile as number)
      : undefined);
    const orderClass = typeof orderMobile === "number" ? `pb-order-mobile-${orderMobile}` : "";

    // Optional container stacking strategy (export-time prop) → class on component
    const stackStrategy = (blockRecord as any).stackStrategy as string | undefined;
    const stackClass = stackStrategy === "reverse" ? "pb-stack-mobile-reverse" : "";

    // Animation + scroll effect props (optional, passthrough)
    const animation = (blockRecord as any).animation as
      | "none"
      | "fade"
      | "slide"
      | "slide-up"
      | "slide-down"
      | "slide-left"
      | "slide-right"
      | "zoom"
      | "rotate"
      | undefined;
    const animationDuration = (blockRecord as any).animationDuration as number | undefined;
    const animationDelay = (blockRecord as any).animationDelay as number | undefined;
    const animationEasing = (blockRecord as any).animationEasing as string | undefined;
    const reveal = (blockRecord as any).reveal as string | undefined;
    const parallax = (blockRecord as any).parallax as number | undefined;
    const sticky = (blockRecord as any).sticky as "top" | "bottom" | undefined;
    const stickyOffset = (blockRecord as any).stickyOffset as string | number | undefined;

    const animClass = animation && animation !== "none"
      ? (
          {
            fade: "pb-animate pb-animate-fade",
            slide: "pb-animate pb-animate-slide",
            "slide-up": "pb-animate pb-animate-slide-up",
            "slide-down": "pb-animate pb-animate-slide-down",
            "slide-left": "pb-animate pb-animate-slide-left",
            "slide-right": "pb-animate pb-animate-slide-right",
            zoom: "pb-animate pb-animate-zoom",
            rotate: "pb-animate pb-animate-rotate",
          } as Record<string, string>
        )[animation] || ""
      : "";

    let extraProps: Record<string, unknown> = {};
    if (getRuntimeProps) {
      const runtime = getRuntimeProps(block, locale);
      extraProps = { ...extraProps, ...(runtime as Record<string, unknown>) };
    }

    if (runtimeData && runtimeData[block.type as BlockType]) {
      extraProps = {
        ...extraProps,
        ...runtimeData[block.type as BlockType],
      };
    }

    // Merge className to pass to the component (so the container element gets the stack class)
    const existing = (rest as any).className as string | undefined;
    const mergedClass = [existing, stackClass].filter(Boolean).join(" ");
    if (mergedClass) extraProps.className = mergedClass;

    const hoverScale = (blockRecord as any).hoverScale as number | undefined;
    const hoverOpacity = (blockRecord as any).hoverOpacity as number | undefined;
    const staggerChildren = (blockRecord as any).staggerChildren as number | undefined;
    const timeline = (blockRecord as any).timeline as any | undefined;
    const lottieUrl = (blockRecord as any).lottieUrl as string | undefined;
    const lottieAutoplay = (blockRecord as any).lottieAutoplay as boolean | undefined;
    const lottieLoop = (blockRecord as any).lottieLoop as boolean | undefined;
    const lottieSpeed = (blockRecord as any).lottieSpeed as number | undefined;
    const lottieTrigger = (blockRecord as any).lottieTrigger as string | undefined;
    const needsHover = typeof hoverScale === 'number' || typeof hoverOpacity === 'number';
    const gridArea = (blockRecord as any).gridArea as string | undefined;
    const gridColumn = (blockRecord as any).gridColumn as string | undefined;
    const gridRow = (blockRecord as any).gridRow as string | undefined;
    const staticTransform = (styleVars as any)["--pb-static-transform"] as string | undefined;

    return (
      <div
        key={id}
        style={{
          ...style,
          ...(typeof animationDuration === "number" ? ({ ["--pb-anim-duration"]: `${animationDuration}ms` } as any) : {}),
          ...(typeof animationDelay === "number" ? ({ ["--pb-anim-delay"]: `${animationDelay}ms` } as any) : {}),
          ...(animationEasing ? ({ ["--pb-anim-ease"]: animationEasing } as any) : {}),
          ...(stickyOffset !== undefined ? ({ ["--pb-sticky-offset"]: typeof stickyOffset === "number" ? `${stickyOffset}px` : String(stickyOffset) } as any) : {}),
          ...(typeof hoverScale === 'number' ? ({ ["--pb-hover-scale"]: String(hoverScale) } as any) : {}),
          ...(typeof hoverOpacity === 'number' ? ({ ["--pb-hover-opacity"]: String(hoverOpacity) } as any) : {}),
          ...(gridArea ? ({ gridArea } as any) : {}),
          ...(gridColumn ? ({ gridColumn } as any) : {}),
          ...(gridRow ? ({ gridRow } as any) : {}),
        }}
        className={["pb-scope", hideClasses, orderClass, animClass].filter(Boolean).join(" ") || undefined}
        data-pb-duration={typeof animationDuration === "number" ? animationDuration : undefined}
        data-pb-delay={typeof animationDelay === "number" ? animationDelay : undefined}
        data-pb-ease={animationEasing || undefined}
        data-pb-reveal={reveal || undefined}
        data-pb-parallax={typeof parallax === "number" ? parallax : undefined}
        data-pb-sticky={sticky || undefined}
        data-pb-sticky-offset={stickyOffset !== undefined ? String(stickyOffset) : undefined}
        data-pb-hover={needsHover ? '1' : undefined}
        data-pb-click={(blockRecord as any).clickAction === 'open-modal' ? 'open-modal' : ((blockRecord as any).clickAction === 'scroll-to' ? 'scroll-to' : undefined)}
        data-pb-href={(blockRecord as any).href || undefined}
        data-pb-modal={(blockRecord as any).modalHtml || undefined}
        data-pb-stagger={typeof staggerChildren === 'number' ? String(staggerChildren) : undefined}
        data-pb-timeline={timeline && timeline.steps && timeline.steps.length ? JSON.stringify(timeline) : undefined}
        data-pb-lottie-url={lottieUrl || undefined}
        data-pb-lottie-autoplay={lottieAutoplay ? '1' : undefined}
        data-pb-lottie-loop={lottieLoop ? '1' : undefined}
        data-pb-lottie-speed={typeof lottieSpeed === 'number' ? String(lottieSpeed) : undefined}
        data-pb-lottie-trigger={lottieTrigger || undefined}
      >
        {needsHover ? (
          <div className="pb-hover-target">
            <Comp
              {...rest}
              {...extraProps}
              id={id}
              type={_type}
              locale={locale}
            >
              {childBlocks?.map((child: PageComponent) => renderBlock(child))}
            </Comp>
          </div>
        ) : staticTransform ? (
          <div style={{ transform: staticTransform } as any}>
            <Comp
              {...rest}
              {...extraProps}
              id={id}
              type={_type}
              locale={locale}
            >
              {childBlocks?.map((child: PageComponent) => renderBlock(child))}
            </Comp>
          </div>
        ) : (
          <Comp
            {...rest}
            {...extraProps}
            id={id}
            type={_type}
            locale={locale}
          >
            {childBlocks?.map((child: PageComponent) => renderBlock(child))}
          </Comp>
        )}
      </div>
    );
  };

  return <>{components.map((c) => renderBlock(c))}</>;
}
