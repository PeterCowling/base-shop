// packages/ui/src/components/DynamicRenderer.tsx

"use client";

import type { CSSProperties, ReactNode } from "react";
import { useEffect } from "react";

import type { Locale } from "@acme/i18n/locales";
import type { HistoryState,PageComponent } from "@acme/page-builder-core";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import { cssVars } from "@acme/ui/utils/style";

import { blockRegistry, type BlockType } from "./cms/blocks";
import type { BlockRegistryEntry } from "./cms/blocks/types";
import { ensureLightboxStyles, initLightbox } from "./cms/lightbox";
import { initLottie } from "./cms/page-builder/lottie";
import { ensureAnimationStyles, ensureScrollStyles, initScrollEffects } from "./cms/page-builder/scrollEffects";
import { initTimelines } from "./cms/page-builder/timeline";

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
      // PB-only props that should not be forwarded to DOM elements/components
      animation: _animIgnored,
      animationDuration: _animDurIgnored,
      animationDelay: _animDelayIgnored,
      animationEasing: _animEaseIgnored,
      reveal: _revealIgnored,
      parallax: _parallaxIgnored,
      sticky: _stickyIgnored,
      stickyOffset: _stickyOffsetIgnored,
      hoverScale: _hoverScaleIgnored,
      hoverOpacity: _hoverOpacityIgnored,
      staggerChildren: _staggerIgnored,
      timeline: _timelineIgnored,
      lottieUrl: _lottieUrlIgnored,
      lottieAutoplay: _lottieAutoplayIgnored,
      lottieLoop: _lottieLoopIgnored,
      lottieSpeed: _lottieSpeedIgnored,
      lottieTrigger: _lottieTriggerIgnored,
      orderMobile: _orderMobileIgnored,
      stackStrategy: _stackStrategyIgnored,
      gridArea: _gridAreaIgnored,
      gridColumn: _gridColumnIgnored,
      gridRow: _gridRowIgnored,
      styles: _stylesIgnored,
      ...rest
    } = block as PageComponent & { children?: PageComponent[] };

    // Inline CSS variables based on style overrides
    let styleVars: CSSProperties = {};
    let varsRecord: Record<string, string> | undefined;
    try {
      const raw = blockRecord.styles as unknown;
      const overrides = (typeof raw === "string" ? JSON.parse(String(raw)) : undefined) as unknown as StyleOverrides | undefined;
      const vars = cssVars(overrides);
      styleVars = vars as unknown as CSSProperties;
      varsRecord = vars as Record<string, string>;
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
      fontFamily: varsRecord?.["--font-family"] ? ("var(--font-family)" as unknown as CSSProperties["fontFamily"]) : undefined,
      fontSize:
        varsRecord?.["--font-size"] ||
        varsRecord?.["--font-size-desktop"] ||
        varsRecord?.["--font-size-tablet"] ||
        varsRecord?.["--font-size-mobile"]
          ? ("var(--font-size)" as unknown as CSSProperties["fontSize"]) : undefined,
      lineHeight:
        varsRecord?.["--line-height"] ||
        varsRecord?.["--line-height-desktop"] ||
        varsRecord?.["--line-height-tablet"] ||
        varsRecord?.["--line-height-mobile"]
          ? ("var(--line-height)" as unknown as CSSProperties["lineHeight"]) : undefined,
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
    const om = (blockRecord as Record<string, unknown>).orderMobile as unknown;
    const orderMobile = typeof om === "number" ? om : undefined;
    const orderClass = typeof orderMobile === "number" ? `pb-order-mobile-${orderMobile}` : "";

    // Optional container stacking strategy (export-time prop) → class on component
    const stackStrategy = (blockRecord as Record<string, unknown>).stackStrategy as string | undefined;
    const stackClass = stackStrategy === "reverse" ? "pb-stack-mobile-reverse" : "";

    // Animation + scroll effect props (optional, passthrough)
    type AnimationType =
      | "none"
      | "fade"
      | "slide"
      | "slide-up"
      | "slide-down"
      | "slide-left"
      | "slide-right"
      | "zoom"
      | "rotate";
    const allowedAnimations: readonly AnimationType[] = [
      "none",
      "fade",
      "slide",
      "slide-up",
      "slide-down",
      "slide-left",
      "slide-right",
      "zoom",
      "rotate",
    ] as const;
    const animRaw = (blockRecord as Record<string, unknown>).animation;
    const animation = (typeof animRaw === "string" && (allowedAnimations as readonly string[]).includes(animRaw))
      ? (animRaw as AnimationType)
      : undefined;
    const animationDuration = (blockRecord as Record<string, unknown>).animationDuration as number | undefined;
    const animationDelay = (blockRecord as Record<string, unknown>).animationDelay as number | undefined;
    const animationEasing = (blockRecord as Record<string, unknown>).animationEasing as string | undefined;
    const reveal = (blockRecord as Record<string, unknown>).reveal as string | undefined;
    const parallax = (blockRecord as Record<string, unknown>).parallax as number | undefined;
    const sticky = (blockRecord as Record<string, unknown>).sticky as "top" | "bottom" | undefined;
    const stickyOffset = (blockRecord as Record<string, unknown>).stickyOffset as string | number | undefined;

    const animClass = animation && animation !== "none"
      ? (
          {
            fade: "pb-animate pb-animate-fade", // i18n-exempt -- PB-2419: CSS class string, not user-facing copy
            slide: "pb-animate pb-animate-slide", // i18n-exempt -- PB-2419: CSS class string, not user-facing copy
            "slide-up": "pb-animate pb-animate-slide-up", // i18n-exempt -- PB-2419: CSS class string, not user-facing copy
            "slide-down": "pb-animate pb-animate-slide-down", // i18n-exempt -- PB-2419: CSS class string, not user-facing copy
            "slide-left": "pb-animate pb-animate-slide-left", // i18n-exempt -- PB-2419: CSS class string, not user-facing copy
            "slide-right": "pb-animate pb-animate-slide-right", // i18n-exempt -- PB-2419: CSS class string, not user-facing copy
            zoom: "pb-animate pb-animate-zoom", // i18n-exempt -- PB-2419: CSS class string, not user-facing copy
            rotate: "pb-animate pb-animate-rotate", // i18n-exempt -- PB-2419: CSS class string, not user-facing copy
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
    const existing = (rest as { className?: unknown }).className as string | undefined;
    const mergedClass = [existing, stackClass].filter(Boolean).join(" ");
    if (mergedClass) extraProps.className = mergedClass;

    const hoverScale = (blockRecord as Record<string, unknown>).hoverScale as number | undefined;
    const hoverOpacity = (blockRecord as Record<string, unknown>).hoverOpacity as number | undefined;
    const staggerChildren = (blockRecord as Record<string, unknown>).staggerChildren as number | undefined;
    const timeline = (blockRecord as Record<string, unknown>).timeline as unknown;
    const lottieUrl = (blockRecord as Record<string, unknown>).lottieUrl as string | undefined;
    const lottieAutoplay = (blockRecord as Record<string, unknown>).lottieAutoplay as boolean | undefined;
    const lottieLoop = (blockRecord as Record<string, unknown>).lottieLoop as boolean | undefined;
    const lottieSpeed = (blockRecord as Record<string, unknown>).lottieSpeed as number | undefined;
    const lottieTrigger = (blockRecord as Record<string, unknown>).lottieTrigger as string | undefined;
    const needsHover = typeof hoverScale === 'number' || typeof hoverOpacity === 'number';
    const gridArea = (blockRecord as Record<string, unknown>).gridArea as string | undefined;
    const gridColumn = (blockRecord as Record<string, unknown>).gridColumn as string | undefined;
    const gridRow = (blockRecord as Record<string, unknown>).gridRow as string | undefined;
    const staticTransform = varsRecord?.["--pb-static-transform"] as string | undefined;

    // Remove non-DOM/implementation-only props from the component spread
    const { staggerChildren: _staggerChildren_omit, ...cleanRest } = (rest as Record<string, unknown>);
    const { staggerChildren: _staggerChildren_extra, ...cleanExtraProps } = (extraProps as Record<string, unknown>);

    /* eslint-disable react/forbid-dom-props -- PB-2419: dynamic per-block layout and CSS variable injection require inline styles on wrapper(s) */
    return (
      <div
        key={id}
        style={{
          ...style,
          ...((): Record<string, string> => {
            const dyn: Record<string, string> = {};
            if (typeof animationDuration === "number") dyn["--pb-anim-duration"] = `${animationDuration}ms`;
            if (typeof animationDelay === "number") dyn["--pb-anim-delay"] = `${animationDelay}ms`;
            if (animationEasing) dyn["--pb-anim-ease"] = animationEasing;
            if (stickyOffset !== undefined) dyn["--pb-sticky-offset"] = typeof stickyOffset === "number" ? `${stickyOffset}px` : String(stickyOffset);
            if (typeof hoverScale === 'number') dyn["--pb-hover-scale"] = String(hoverScale);
            if (typeof hoverOpacity === 'number') dyn["--pb-hover-opacity"] = String(hoverOpacity);
            return dyn;
          })(),
          ...(gridArea ? ({ gridArea } as CSSProperties) : {}),
          ...(gridColumn ? ({ gridColumn } as CSSProperties) : {}),
          ...(gridRow ? ({ gridRow } as CSSProperties) : {}),
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
        data-pb-click={(() => {
          const action = (blockRecord as Record<string, unknown>).clickAction as string | undefined;
          return action === 'open-modal' ? 'open-modal' : action === 'scroll-to' ? 'scroll-to' : undefined;
        })()}
        data-pb-href={((blockRecord as Record<string, unknown>).href as string | undefined) || undefined}
        data-pb-modal={((blockRecord as Record<string, unknown>).modalHtml as string | undefined) || undefined}
        data-pb-stagger={typeof staggerChildren === 'number' ? String(staggerChildren) : undefined}
        data-pb-timeline={(() => { const t = timeline as { steps?: unknown[] } | undefined; return t && Array.isArray(t.steps) && t.steps.length ? JSON.stringify(t) : undefined; })()}
        data-pb-lottie-url={lottieUrl || undefined}
        data-pb-lottie-autoplay={lottieAutoplay ? '1' : undefined}
        data-pb-lottie-loop={lottieLoop ? '1' : undefined}
        data-pb-lottie-speed={typeof lottieSpeed === 'number' ? String(lottieSpeed) : undefined}
        data-pb-lottie-trigger={lottieTrigger || undefined}
      >
        {needsHover ? (
          <div className="pb-hover-target">
            <Comp
              {...(cleanRest as Record<string, unknown>)}
              {...(cleanExtraProps as Record<string, unknown>)}
              id={id}
              type={_type}
              locale={locale}
            >
              {childBlocks?.map((child: PageComponent) => renderBlock(child))}
            </Comp>
          </div>
        ) : staticTransform ? (
          <div style={{ transform: staticTransform } as CSSProperties}>
            <Comp
              {...(cleanRest as Record<string, unknown>)}
              {...(cleanExtraProps as Record<string, unknown>)}
              id={id}
              type={_type}
              locale={locale}
            >
              {childBlocks?.map((child: PageComponent) => renderBlock(child))}
            </Comp>
          </div>
        ) : (
          <Comp
            {...(cleanRest as Record<string, unknown>)}
            {...(cleanExtraProps as Record<string, unknown>)}
            id={id}
            type={_type}
            locale={locale}
          >
            {childBlocks?.map((child: PageComponent) => renderBlock(child))}
          </Comp>
        )}
      </div>
    );
    /* eslint-enable react/forbid-dom-props */
  };

  return <>{components.map((c) => renderBlock(c))}</>;
}
