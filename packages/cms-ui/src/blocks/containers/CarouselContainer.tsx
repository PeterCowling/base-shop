"use client";
import React, { useRef, useState } from "react";

import { Inline } from "@acme/design-system/primitives/Inline";
import { Button } from "@acme/design-system/shadcn";
import { cn } from "@acme/design-system/utils/style";
import { useTranslations } from "@acme/i18n";

export interface CarouselContainerProps {
  children?: React.ReactNode;
  slidesPerView?: number;
  slidesPerViewDesktop?: number;
  slidesPerViewTablet?: number;
  slidesPerViewMobile?: number;
  gap?: string;
  gapDesktop?: string;
  gapTablet?: string;
  gapMobile?: string;
  showArrows?: boolean;
  showDots?: boolean;
  className?: string;
  pbViewport?: "desktop" | "tablet" | "mobile";
}

export default function CarouselContainer({
  children,
  slidesPerView,
  slidesPerViewDesktop,
  slidesPerViewTablet,
  slidesPerViewMobile,
  gap,
  gapDesktop,
  gapTablet,
  gapMobile,
  showArrows = true,
  showDots = true,
  className,
  pbViewport,
}: CarouselContainerProps) {
  const t = useTranslations();
  const eff = <T,>(base?: T, d?: T, t?: T, m?: T): T | undefined => {
    if (pbViewport === "desktop" && d !== undefined) return d;
    if (pbViewport === "tablet" && t !== undefined) return t;
    if (pbViewport === "mobile" && m !== undefined) return m;
    return base;
  };
  const effSlides = Math.max(1, Number(eff<number>(slidesPerView ?? 1, slidesPerViewDesktop, slidesPerViewTablet, slidesPerViewMobile) || 1));
  const effGap = eff<string>(gap ?? "1rem", gapDesktop, gapTablet, gapMobile) ?? "1rem";
  const listRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  const scrollBy = (dir: -1 | 1) => {
    const el = listRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.9 * dir;
    el.scrollBy({ left: amount, behavior: "smooth" });
    // naive index estimate
    const next = Math.max(0, Math.round((el.scrollLeft + amount) / el.clientWidth));
    setActive(next);
  };

  const items = Array.isArray(children) ? children : children ? [children] : [];
  // i18n-exempt -- ABC-123 [ttl=2026-01-31] CSS utility classes
  const DOT_BASE_CLASS = "h-2 w-2 rounded-full";
  // i18n-exempt -- ABC-123 [ttl=2026-01-31] CSS utility classes
  const DOT_ACTIVE_CLASS = "bg-foreground";
  // i18n-exempt -- ABC-123 [ttl=2026-01-31] CSS utility classes
  const DOT_INACTIVE_CLASS = "bg-muted-foreground/40";
  const entries = items.map((child, i) => {
    let key: string;
    if (React.isValidElement(child) && child.key != null) key = String(child.key);
    else if (React.isValidElement(child)) {
      const props = (child as React.ReactElement).props as Record<string, unknown>;
      const idLike = (props?.id ?? props?.["data-key"] ?? props?.["data-id"]) as string | number | undefined;
      if (idLike != null) {
        key = String(idLike);
      } else {
        key = `slide-${i}`;
      }
    } else if (typeof child === "string") key = child;
    else key = `slide-${i}`; // fallback; consumers should pass keys/ids for stable identity
    return { key, child };
  });
  return (
    <div className={className}>
      <div className="relative">
        {showArrows && (
          <div className="pointer-events-none absolute inset-y-0 start-0 end-0 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            className="pointer-events-auto ms-2 h-10 w-10 min-h-10 min-w-10 p-0"
            onClick={() => scrollBy(-1)}
            aria-label={t("carousel.prev") as string}
          >
            {/* i18n-exempt -- I18N-0003 [ttl=2025-01-31] decorative icon, not user-visible copy */}
            <svg aria-hidden focusable="false" width="16" height="16" viewBox="0 0 16 16">
              <path d="M10.5 3.5 5.5 8l5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="pointer-events-auto me-2 h-10 w-10 min-h-10 min-w-10 p-0"
            onClick={() => scrollBy(1)}
            aria-label={t("carousel.next") as string}
          >
            {/* i18n-exempt -- I18N-0003 [ttl=2025-01-31] decorative icon, not user-visible copy */}
            <svg aria-hidden focusable="false" width="16" height="16" viewBox="0 0 16 16">
              <path d="M5.5 3.5 10.5 8l-5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Button>
        </div>
      )}
      <Inline
        ref={listRef}
        alignY="center"
        wrap={false}
        className="snap-x snap-mandatory overflow-x-auto"
        style={{ gap: effGap as string, scrollPadding: effGap as string }}
      >
        {entries.map(({ child, key }) => (
          <div
            key={key}
            className="snap-start"
             
            style={{ flex: `0 0 calc(${100 / effSlides}% - ${typeof effGap === 'string' ? effGap : '0px'})` }}
          >
            {child}
          </div>
        ))}
      </Inline>
      {showDots && items.length > 1 && (
        <Inline className="mt-2 justify-center" gap={2}>
          {entries.map((entry, i) => (
            <button key={`dot-${entry.key}`} type="button" aria-label={String(t("carousel.goToSlide", { n: i + 1 }))} onClick={() => {
              const el = listRef.current; if (!el) return; el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' /* i18n-exempt -- I18N-0003 [ttl=2025-01-31] DOM API value */ }); setActive(i);
            }} className={cn(DOT_BASE_CLASS, i === active ? DOT_ACTIVE_CLASS : DOT_INACTIVE_CLASS)} />
          ))}
        </Inline>
      )}
      </div>
    </div>
  );
}
