"use client";
import type { ReactNode, HTMLAttributes } from "react";
import ShapeDivider from "./ShapeDivider";

export interface SectionProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  /** Padding applied to the section */
  padding?: string;
  /** Background color for the section */
  backgroundColor?: string;
  /** Max content width (used for inner content wrapper) */
  contentWidth?: string;
  /** Max content width on desktop */
  contentWidthDesktop?: string;
  /** Max content width on tablet */
  contentWidthTablet?: string;
  /** Max content width on mobile */
  contentWidthMobile?: string;
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
  const resolveContentWidth = () => {
    const vp = pbViewport;
    if (vp === "desktop" && contentWidthDesktop) return contentWidthDesktop;
    if (vp === "tablet" && contentWidthTablet) return contentWidthTablet;
    if (vp === "mobile" && contentWidthMobile) return contentWidthMobile;
    return contentWidth;
  };
  const maxWidth = resolveContentWidth();
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
  return (
    <div
      {...rest}
      className={[className, "relative"].filter(Boolean).join(" ") || undefined}
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
      {/* Top shape divider (rendered before background media so it sits above background) */}
      {topShapePreset ? (
        <ShapeDivider position="top" preset={topShapePreset} color={topShapeColor} height={topShapeHeight} flipX={topShapeFlipX} />
      ) : null}
      {/* Absolute video background when provided */}
      {backgroundVideoUrl ? (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            className="h-full w-full object-cover"
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
      {/* Overlay */}
      {backgroundOverlay ? (
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: backgroundOverlay, zIndex: 1 }} />
      ) : null}
      {/* Inner content wrapper to constrain content width and alignment */}
      <div
        data-pb-section-inner=""
        style={{
          maxWidth: maxWidth || undefined,
          width: "100%",
          position: "relative",
          zIndex: 2,
          ...alignStyle,
          ...(equalizeInnerHeights
            ? ({ display: "grid", gridAutoRows: "1fr", alignItems: "stretch" } as React.CSSProperties)
            : ({} as React.CSSProperties)),
        }}
      >
        {children}
      </div>
      {/* Bottom shape divider */}
      {bottomShapePreset ? (
        <ShapeDivider position="bottom" preset={bottomShapePreset} color={bottomShapeColor} height={bottomShapeHeight} flipX={bottomShapeFlipX} />
      ) : null}
    </div>
  );
}
