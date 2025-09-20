"use client";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
import DOMPurify from "dompurify";
import { memo, type ComponentType } from "react";
import { blockRegistry } from "../blocks";

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
  } = component as PageComponent & {
    clickAction?: "none" | "navigate";
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
  };
  void _id;
  void _type;

  const compProps: Record<string, unknown> = { ...(props as Record<string, unknown>) };
  if (clickAction === "navigate" && href) compProps.href = href;
  let rendered = <Comp {...compProps} locale={locale} />;
  if (clickAction === "navigate" && href && component.type !== "Button") {
    rendered = (
      <a href={href} onClick={(e) => e.preventDefault()} className="cursor-pointer">
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
  const reveal = (component as any).reveal as
    | "fade"
    | "slide-up"
    | "slide-down"
    | "slide-left"
    | "slide-right"
    | "zoom"
    | "rotate"
    | undefined;
  const parallax = (component as any).parallax as number | undefined;
  const sticky = (component as any).sticky as "top" | "bottom" | undefined;
  const stickyOffset = (component as any).stickyOffset as string | number | undefined;

  const needsWrapper =
    !!animationClass || !!reveal || typeof parallax === "number" || !!sticky;

  if (!needsWrapper) return rendered;

  const styleVars: Record<string, string> = {};
  if (typeof animationDuration === "number") styleVars["--pb-anim-duration"] = `${animationDuration}ms`;
  if (typeof animationDelay === "number") styleVars["--pb-anim-delay"] = `${animationDelay}ms`;
  if (animationEasing) styleVars["--pb-anim-ease"] = `${animationEasing}`;
  if (stickyOffset !== undefined) {
    const val = typeof stickyOffset === "number" ? `${stickyOffset}px` : String(stickyOffset);
    styleVars["--pb-sticky-offset"] = val;
  }

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
      style={styleVars as any}
    >
      {rendered}
    </div>
  );
}

export default memo(Block);
