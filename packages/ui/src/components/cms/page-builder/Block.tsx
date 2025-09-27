"use client";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
import DOMPurify from "dompurify";
import { memo, type ComponentType, type CSSProperties } from "react";
import type { StyleOverrides } from "@acme/types/style/StyleOverrides";
import { blockRegistry } from "../blocks";
import { cssVars } from "../../../utils/style/cssVars";
import { ensureScrollStyles } from "./scrollEffects";
import { initTimelines } from "./timeline";
import { initLottie } from "./lottie";

const ANIMATION_STYLE_ID = "pb-animations";
function injectAnimations() {
  if (typeof document === "undefined") return;
  if (document.getElementById(ANIMATION_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = ANIMATION_STYLE_ID;
  style.textContent = `
@keyframes pb-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes pb-slide { from { transform: translateY(1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes pb-slide-up { from { transform: translateY(1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes pb-slide-down { from { transform: translateY(-1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes pb-slide-left { from { transform: translateX(1rem); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes pb-slide-right { from { transform: translateX(-1rem); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes pb-zoom { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes pb-rotate { from { transform: rotate(-8deg); opacity: 0; } to { transform: rotate(0deg); opacity: 1; } }

.pb-animate { animation-duration: var(--pb-anim-duration, .5s); animation-delay: var(--pb-anim-delay, 0s); animation-timing-function: var(--pb-anim-ease, ease); animation-fill-mode: both; will-change: transform, opacity; }
.pb-animate-fade { animation-name: pb-fade; }
.pb-animate-slide { animation-name: pb-slide; }
.pb-animate-slide-up { animation-name: pb-slide-up; }
.pb-animate-slide-down { animation-name: pb-slide-down; }
.pb-animate-slide-left { animation-name: pb-slide-left; }
.pb-animate-slide-right { animation-name: pb-slide-right; }
.pb-animate-zoom { animation-name: pb-zoom; }
.pb-animate-rotate { animation-name: pb-rotate; }
`;
  document.head.appendChild(style);
}
injectAnimations();
ensureScrollStyles();
initTimelines();
initLottie();

type BuilderOnlyProps = {
  clickAction?: "none" | "navigate" | "open-modal" | "scroll-to";
  href?: string;
  animation?:
    | "none"
    | "fade"
    | "slide"
    | "slide-up"
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | "zoom"
    | "rotate";
  animationDuration?: number;
  animationDelay?: number;
  animationEasing?: string;
  // Scroll effects
  reveal?:
    | "fade"
    | "slide-up"
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | "zoom"
    | "rotate";
  parallax?: number;
  sticky?: "top" | "bottom";
  stickyOffset?: string | number;
  // Hover
  hoverScale?: number;
  hoverOpacity?: number;
  // Children animation
  staggerChildren?: number;
  // Timeline (runtime only; shape is not fully typed here)
  timeline?: unknown;
  // Lottie props
  lottieUrl?: string;
  lottieAutoplay?: boolean;
  lottieLoop?: boolean;
  lottieSpeed?: number;
  lottieTrigger?: string;
  // Grid overrides
  gridArea?: string;
  gridColumn?: string;
  gridRow?: string;
  // JSON string of style overrides
  styles?: string;
  // Modal content for clickAction 'open-modal'
  modalHtml?: string;
};

function Block({ component, locale }: { component: PageComponent; locale: Locale }) {
  if (component.type === "Text") {
    const { text } =
      component as Extract<
        PageComponent,
        { type: "Text"; text?: string | Record<string, string> }
      >;
    const value = typeof text === "string" ? text : text?.[locale] ?? "";
    const sanitized = DOMPurify.sanitize(value);
    return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
  }
  const entry = blockRegistry[component.type as keyof typeof blockRegistry];
  if (!entry) return null;
  const Comp = entry.component as ComponentType<Record<string, unknown>>;

  const {
    id: _id,
    type: _type,
    clickAction,
    href,
    animation,
    animationDuration,
    animationDelay,
    animationEasing,
    ...props
  } = component as PageComponent & BuilderOnlyProps;
  void _id;
  void _type;

  // Remove PB-only props that shouldn't leak to DOM nodes
  const {
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
    gridArea: _gridAreaIgnored,
    gridColumn: _gridColumnIgnored,
    gridRow: _gridRowIgnored,
    styles: _stylesIgnored,
    // Editor-only responsive sizing/spacing keys that must not hit the DOM
    widthDesktop: _widthDesktopIgnored,
    widthTablet: _widthTabletIgnored,
    widthMobile: _widthMobileIgnored,
    heightDesktop: _heightDesktopIgnored,
    heightTablet: _heightTabletIgnored,
    heightMobile: _heightMobileIgnored,
    marginDesktop: _marginDesktopIgnored,
    marginTablet: _marginTabletIgnored,
    marginMobile: _marginMobileIgnored,
    paddingDesktop: _paddingDesktopIgnored,
    paddingTablet: _paddingTabletIgnored,
    paddingMobile: _paddingMobileIgnored,
    leftDesktop: _leftDesktopIgnored,
    leftTablet: _leftTabletIgnored,
    leftMobile: _leftMobileIgnored,
    topDesktop: _topDesktopIgnored,
    topTablet: _topTabletIgnored,
    topMobile: _topMobileIgnored,
    pbViewport: _pbViewportIgnored,
    // Canvas/editor specific props
    zIndex: _zIndexIgnored,
    locked: _lockedIgnored,
    anchorId: _anchorIdIgnored,
    ...safeProps
  } = props as Record<string, unknown>;
  const compProps: Record<string, unknown> = { ...safeProps };
  if (clickAction === "navigate" && href) compProps.href = href;
  // Inline style vars from overrides for builder preview
  let styleVars: Record<string, string> = {};
  try {
    const raw = (component as PageComponent & BuilderOnlyProps).styles;
    const parsed = raw ? (JSON.parse(String(raw)) as unknown) : undefined;
    const overrides = parsed && typeof parsed === "object" ? (parsed as StyleOverrides) : undefined;
    styleVars = cssVars(overrides);
  } catch {
    // ignore invalid style JSON in builder
  }

  let rendered = <Comp {...compProps} locale={locale} />;
  if (clickAction === "navigate" && href && component.type !== "Button") {
    rendered = (
      <a href={href} onClick={(e) => e.preventDefault()} className="cursor-pointer inline-block min-h-10 min-w-10">
        {rendered}
      </a>
    );
  }
  const animationClass =
    animation && animation !== "none"
      ?
          (
            (
              {
                fade: "pb-animate-fade",
                slide: "pb-animate-slide",
                "slide-up": "pb-animate-slide-up",
                "slide-down": "pb-animate-slide-down",
                "slide-left": "pb-animate-slide-left",
                "slide-right": "pb-animate-slide-right",
                zoom: "pb-animate-zoom",
                rotate: "pb-animate-rotate",
              } as Record<string, string>
            )[animation]
          ) || undefined
      : undefined;

  // Scroll effects support (optional props on component)
  const {
    reveal,
    parallax,
    sticky,
    stickyOffset,
    hoverScale,
    hoverOpacity,
    staggerChildren,
    timeline,
    lottieUrl,
    lottieAutoplay,
    lottieLoop,
    lottieSpeed,
    lottieTrigger,
    gridArea,
    gridColumn,
    gridRow,
  } = component as PageComponent & BuilderOnlyProps;
  const needsHover = typeof hoverScale === "number" || typeof hoverOpacity === "number";
  const needsWrapper =
    !!animationClass || !!reveal || typeof parallax === "number" || !!sticky || needsHover || Object.keys(styleVars).length > 0 || typeof staggerChildren === 'number';

  if (!needsWrapper) return rendered;

  const wrapStyleVars: Record<string, string> = { ...styleVars };
  const staticTransform = (wrapStyleVars as Record<string, string>)["--pb-static-transform"] as string | undefined;
  if (typeof animationDuration === "number") styleVars["--pb-anim-duration"] = `${animationDuration}ms`;
  if (typeof animationDelay === "number") styleVars["--pb-anim-delay"] = `${animationDelay}ms`;
  if (animationEasing) styleVars["--pb-anim-ease"] = `${animationEasing}`;
  if (stickyOffset !== undefined) {
    const val = typeof stickyOffset === "number" ? `${stickyOffset}px` : String(stickyOffset);
    wrapStyleVars["--pb-sticky-offset"] = val;
  }
  if (typeof hoverScale === 'number') wrapStyleVars["--pb-hover-scale"] = String(hoverScale);
  if (typeof hoverOpacity === 'number') wrapStyleVars["--pb-hover-opacity"] = String(hoverOpacity);
  if (gridArea) (wrapStyleVars as unknown as Record<string, string>).gridArea = gridArea;
  if (gridColumn) (wrapStyleVars as unknown as Record<string, string>).gridColumn = gridColumn;
  if (gridRow) (wrapStyleVars as unknown as Record<string, string>).gridRow = gridRow;

  const className = [animationClass ? "pb-animate" : undefined, animationClass]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className || undefined}
      data-pb-duration={typeof animationDuration === "number" ? animationDuration : undefined}
      data-pb-delay={typeof animationDelay === "number" ? animationDelay : undefined}
      data-pb-ease={animationEasing || undefined}
      data-pb-reveal={reveal || undefined}
      data-pb-parallax={typeof parallax === "number" ? parallax : undefined}
      data-pb-sticky={sticky || undefined}
      data-pb-sticky-offset={stickyOffset !== undefined ? String(stickyOffset) : undefined}
      data-pb-hover={needsHover ? '1' : undefined}
      data-pb-click={clickAction === 'open-modal' || clickAction === 'scroll-to' ? clickAction : undefined}
      data-pb-href={href || undefined}
      data-pb-modal={(component as PageComponent & BuilderOnlyProps).modalHtml || undefined}
      data-pb-stagger={typeof staggerChildren === 'number' ? String(staggerChildren) : undefined}
      data-pb-timeline={(typeof timeline === 'object' && timeline !== null && 'steps' in (timeline as Record<string, unknown>) && Array.isArray((timeline as Record<string, unknown>).steps) && ((timeline as Record<string, unknown>).steps as unknown[]).length)
        ? JSON.stringify(timeline)
        : undefined}
      data-pb-lottie-url={lottieUrl || undefined}
      data-pb-lottie-autoplay={lottieAutoplay ? '1' : undefined}
      data-pb-lottie-loop={lottieLoop ? '1' : undefined}
      data-pb-lottie-speed={typeof lottieSpeed === 'number' ? String(lottieSpeed) : undefined}
      data-pb-lottie-trigger={lottieTrigger || undefined}
      style={wrapStyleVars as unknown as CSSProperties}
    >
      {needsHover ? (
        <div className="pb-hover-target">
          {rendered}
        </div>
      ) : staticTransform ? (
        <div style={{ transform: staticTransform } as CSSProperties}>{rendered}</div>
      ) : (
        rendered
      )}
    </div>
  );
}

export default memo(Block);
