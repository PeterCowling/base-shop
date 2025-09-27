"use client";
import { useRef, useState } from "react";
import { useTranslations } from "@acme/i18n";
import { Button } from "../../../atoms/shadcn";
import { cn } from "../../../../utils/style";
import { Inline } from "../../../atoms/primitives/Inline";

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
            <span aria-hidden>‹</span>{/* i18n-exempt: decorative glyph */}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="pointer-events-auto me-2 h-10 w-10 min-h-10 min-w-10 p-0"
            onClick={() => scrollBy(1)}
            aria-label={t("carousel.next") as string}
          >
            <span aria-hidden>›</span>{/* i18n-exempt: decorative glyph */}
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
        {items.map((child, i) => (
          <div
            key={i}
            className="snap-start"
            style={{ flex: `0 0 calc(${100 / effSlides}% - ${typeof effGap === 'string' ? effGap : '0px'})` }}
          >
            {child}
          </div>
        ))}
      </Inline>
      {showDots && items.length > 1 && (
        <Inline className="mt-2 justify-center" gap={2}>
          {items.map((_, i) => (
            <button key={i} type="button" aria-label={String(t("carousel.goToSlide", { n: i + 1 }))} onClick={() => {
              const el = listRef.current; if (!el) return; el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' /* i18n-exempt -- DOM API value -- ABC-123 */ }); setActive(i);
            }} className={cn("h-2 w-2 rounded-full", i === active ? "bg-foreground" : "bg-muted-foreground/40")} />
          ))}
        </Inline>
      )}
      </div>
    </div>
  );
}
