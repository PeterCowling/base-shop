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
  style.textContent = `@keyframes pb-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes pb-slide { from { transform: translateY(1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.pb-animate-fade { animation: pb-fade 0.5s ease both; }
.pb-animate-slide { animation: pb-slide 0.5s ease both; }`;
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
    ...props
  } = component as PageComponent & {
    clickAction?: "none" | "navigate";
    href?: string;
    animation?: "none" | "fade" | "slide";
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
    animation === "fade"
      ? "pb-animate-fade"
      : animation === "slide"
      ? "pb-animate-slide"
      : undefined;
  return animationClass ? <div className={animationClass}>{rendered}</div> : rendered;
}

export default memo(Block);
