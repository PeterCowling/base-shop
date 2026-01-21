"use client";
import type { HTMLAttributes,ReactNode } from "react";
import { useMemo } from "react";

import useInView from "../../../hooks/useInView";

import ShapeDivider from "./ShapeDivider";

export interface SectionProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Padding applied to the section */
  padding?: string;
  /** Background color for the section */
  backgroundColor?: string;
  /** Max content width (used for inner content wrapper) */
  contentWidth?: string | "full" | "wide" | "normal" | "narrow";
  /** Max content width on desktop */
  contentWidthDesktop?: string;
  /** Max content width on tablet */
  contentWidthTablet?: string;
  /** Max content width on mobile */
  contentWidthMobile?: string;
  /** Density scale for vertical spacing */
  density?: "compact" | "spacious";
  /** Toggle section-local dark theme */
  themeDark?: boolean;
  /** Opt-in minimal scroll animation */
  animateOnScroll?: boolean;
  /** Horizontal alignment of the content wrapper */
  contentAlign?: "left" | "center" | "right";
  /** Horizontal alignment per viewport */
  contentAlignDesktop?: "left" | "center" | "right";
  contentAlignTablet?: "left" | "center" | "right";
  contentAlignMobile?: "left" | "center" | "right";
  /** Builder-only: active viewport to resolve responsive props */
  pbViewport?: "desktop" | "tablet" | "mobile";
  /** Editor-only: per-section grid columns for snapping */
  gridCols?: number;
  /** Editor-only: per-section grid gutter (CSS length) */
  gridGutter?: string;
  /** Editor-only: enable grid snapping inside this section */
  gridSnap?: boolean;
  /** Background image options */
  backgroundImageUrl?: string;
  backgroundFocalPoint?: { x: number; y: number };
  backgroundSize?: 'cover' | 'contain' | 'auto';
  backgroundRepeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
  backgroundAttachment?: 'scroll' | 'fixed' | 'local';
  /** Overlay color/gradient on top of background image/video */
  backgroundOverlay?: string;
  /** Background video options */
  backgroundVideoUrl?: string;
  backgroundVideoPoster?: string;
  backgroundVideoLoop?: boolean;
  backgroundVideoMuted?: boolean;
  /** Optional parallax factor for the whole section */
  sectionParallax?: number;
  /** Shape dividers */
  topShapePreset?: "wave" | "tilt" | "curve" | "mountain" | "triangle";
  topShapeColor?: string;
  topShapeHeight?: number;
  topShapeFlipX?: boolean;
  bottomShapePreset?: "wave" | "tilt" | "curve" | "mountain" | "triangle";
  bottomShapeColor?: string;
  bottomShapeHeight?: number;
  bottomShapeFlipX?: boolean;
  /** When enabled, make inner children share equal row heights using CSS Grid */
  equalizeInnerHeights?: boolean;
}

export default function Section({
  children,
  padding,
  backgroundColor,
  contentWidth,
  contentWidthDesktop,
  contentWidthTablet,
  contentWidthMobile,
  density = "compact",
  themeDark = false,
  animateOnScroll = false,
  contentAlign = "center",
  contentAlignDesktop,
  contentAlignTablet,
  contentAlignMobile,
  pbViewport,
  gridCols,
  gridGutter,
  gridSnap,
  backgroundImageUrl,
  backgroundFocalPoint,
  backgroundSize,
  backgroundRepeat,
  backgroundAttachment,
  backgroundOverlay,
  backgroundVideoUrl,
  backgroundVideoPoster,
  backgroundVideoLoop,
  backgroundVideoMuted,
  sectionParallax,
  topShapePreset,
  topShapeColor,
  topShapeHeight,
  topShapeFlipX,
  bottomShapePreset,
  bottomShapeColor,
  bottomShapeHeight,
  bottomShapeFlipX,
  equalizeInnerHeights,
  style,
  className,
  ...rest
}: SectionProps) {
  // Filter out builder-only sizing props so they don't leak to the DOM
  const {
    heightDesktop: _heightDesktop,
    heightTablet: _heightTablet,
    heightMobile: _heightMobile,
    widthDesktop: _widthDesktop,
    widthTablet: _widthTablet,
    widthMobile: _widthMobile,
    marginDesktop: _marginDesktop,
    marginTablet: _marginTablet,
    marginMobile: _marginMobile,
    paddingDesktop: _paddingDesktop,
    paddingTablet: _paddingTablet,
    paddingMobile: _paddingMobile,
    leftDesktop: _leftDesktop,
    leftTablet: _leftTablet,
    leftMobile: _leftMobile,
    topDesktop: _topDesktop,
    topTablet: _topTablet,
    topMobile: _topMobile,
    pbViewport: _pbViewport,
    ...domProps
  } = (rest as unknown) as Record<string, unknown>;
  const resolveContentWidth = () => {
    const vp = pbViewport;
    if (vp === "desktop" && contentWidthDesktop) return contentWidthDesktop;
    if (vp === "tablet" && contentWidthTablet) return contentWidthTablet;
    if (vp === "mobile" && contentWidthMobile) return contentWidthMobile;
    return contentWidth;
  };
  const maxWidth = resolveContentWidth();
  const widthClass = useMemo(() => {
    const v = maxWidth;
    switch (v) {
      case "full":
        return "max-w-none";
      case "wide":
        return "max-w-7xl";
      case "normal":
        return "max-w-5xl";
      case "narrow":
        return "max-w-3xl";
      default:
        return undefined;
    }
  }, [maxWidth]);
  const resolveAlign = () => {
    const vp = pbViewport;
    const value = vp === "desktop" && contentAlignDesktop
      ? contentAlignDesktop
      : vp === "tablet" && contentAlignTablet
        ? contentAlignTablet
        : vp === "mobile" && contentAlignMobile
          ? contentAlignMobile
          : contentAlign;
    return value ?? "center";
  };
  const align = resolveAlign();
  const alignStyle =
    align === "left"
      ? { marginLeft: 0, marginRight: "auto" }
      : align === "right"
        ? { marginLeft: "auto", marginRight: 0 }
        : { marginLeft: "auto", marginRight: "auto" };
  const densityClass = density === "spacious" ? "py-12" : "py-6";
  const [inViewRef, inView] = useInView<HTMLDivElement>(animateOnScroll);
  // i18n-exempt -- DS-1010 [ttl=2026-12-31]
  const AOS_VISIBLE = "opacity-100 translate-y-0"; // i18n-exempt -- DS-1010 [ttl=2026-12-31]
  const AOS_HIDDEN = "opacity-0 translate-y-3"; // i18n-exempt -- DS-1010 [ttl=2026-12-31]
  const RELATIVE_CLASS = "relative"; // i18n-exempt -- DS-1010 [ttl=2026-12-31]
  const TRANSITION_CLASS = "transition-all duration-700 ease-out will-change-transform";
  const aosClass = animateOnScroll ? (inView ? AOS_VISIBLE : AOS_HIDDEN) : undefined;
  const extraProps = domProps as React.HTMLAttributes<HTMLDivElement>;
  /* eslint-disable react/forbid-dom-props -- DS-0003: Section consumes CMS-driven visual styles (padding, bg, overlay) that require dynamic inline style to render correctly across themes. */
  return (
    <div
      {...extraProps}
      className={[className, RELATIVE_CLASS, themeDark ? "theme-dark" : undefined, densityClass]
        .filter(Boolean)
        .join(" ") || undefined}
      data-pb-section=""
      data-pb-parallax={typeof sectionParallax === 'number' ? sectionParallax : undefined}
      style={{
        ...style,
        padding,
        backgroundColor,
        backgroundImage: backgroundImageUrl && !backgroundVideoUrl ? `url(${backgroundImageUrl})` : undefined,
        backgroundSize: backgroundSize,
        backgroundRepeat: backgroundRepeat,
        backgroundAttachment: backgroundAttachment,
        backgroundPosition: backgroundFocalPoint ? `${(backgroundFocalPoint.x * 100).toFixed(2)}% ${(backgroundFocalPoint.y * 100).toFixed(2)}%` : undefined,
        ...((): Record<string, string | number> => {
          const vars: Record<string, string | number> = {};
          if (gridCols) vars["--pb-grid-cols"] = gridCols;
          if (gridGutter) vars["--pb-grid-gutter"] = gridGutter;
          if (gridSnap !== undefined) vars["--pb-grid-snap"] = gridSnap ? 1 : 0;
          return vars;
        })(),
      }}
    >
      
      {topShapePreset ? (
        <ShapeDivider position="top" preset={topShapePreset} color={topShapeColor} height={topShapeHeight} flipX={topShapeFlipX} />
      ) : null}
      
      {backgroundVideoUrl ? (
        // eslint-disable-next-line ds/absolute-parent-guard -- DS-0001: Parent has dynamic 'relative' class via array join; rule cannot statically resolve.
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* eslint-disable-next-line jsx-a11y/media-has-caption -- DS-0004: Decorative background video; not user-facing content, captions not applicable. */}
          <video
            className="h-full w-full object-cover"
            data-aspect="16/9"
            style={{ objectPosition: backgroundFocalPoint ? `${(backgroundFocalPoint.x * 100).toFixed(2)}% ${(backgroundFocalPoint.y * 100).toFixed(2)}%` : undefined }}
            playsInline
            autoPlay
            muted={backgroundVideoMuted ?? true}
            loop={backgroundVideoLoop ?? true}
            poster={backgroundVideoPoster}
          >
            <source src={backgroundVideoUrl} />
          </video>
        </div>
      ) : null}
      
      {backgroundOverlay ? (
        // eslint-disable-next-line ds/absolute-parent-guard -- DS-0001: Parent has dynamic 'relative' class via array join; rule cannot statically resolve.
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: backgroundOverlay }} />
      ) : null}
      
      <div
        ref={inViewRef}
        data-pb-section-inner=""
        className={[widthClass, aosClass, animateOnScroll ? TRANSITION_CLASS : undefined]
          .filter(Boolean)
          .join(" ") || undefined}
        style={{
          maxWidth: widthClass ? undefined : (typeof maxWidth === 'string' ? maxWidth : undefined),
          width: "100%",
          position: "relative",
          ...alignStyle,
          ...(equalizeInnerHeights
            ? ({ display: "grid", gridAutoRows: "1fr", alignItems: "stretch" } as React.CSSProperties)
            : ({} as React.CSSProperties)),
        }}
      >
        {children}
      </div>
      
      {bottomShapePreset ? (
        <ShapeDivider position="bottom" preset={bottomShapePreset} color={bottomShapeColor} height={bottomShapeHeight} flipX={bottomShapeFlipX} />
      ) : null}
    </div>
  );
  /* eslint-enable react/forbid-dom-props */
}
