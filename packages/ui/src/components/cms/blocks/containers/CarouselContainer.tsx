"use client";
import { useRef, useState } from "react";
import { Button } from "../../../atoms/shadcn";
import { cn } from "../../../../utils/style";

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
    <div className={cn("relative", className)}>
      {showArrows && (
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 flex items-center justify-between">
          <Button type="button" variant="outline" className="pointer-events-auto ms-2 h-8 w-8 p-0" onClick={() => scrollBy(-1)} aria-label="Previous slide">‹</Button>
          <Button type="button" variant="outline" className="pointer-events-auto me-2 h-8 w-8 p-0" onClick={() => scrollBy(1)} aria-label="Next slide">›</Button>
        </div>
      )}
      <div
        ref={listRef}
        className="flex snap-x snap-mandatory overflow-x-auto"
        style={{ gap: effGap, scrollPadding: effGap as string }}
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
      </div>
      {showDots && items.length > 1 && (
        <div className="mt-2 flex justify-center gap-2">
          {items.map((_, i) => (
            <button key={i} type="button" aria-label={`Go to slide ${i + 1}`} onClick={() => {
              const el = listRef.current; if (!el) return; el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' }); setActive(i);
            }} className={cn("h-2 w-2 rounded-full", i === active ? "bg-foreground" : "bg-muted-foreground/40")} />
          ))}
        </div>
      )}
    </div>
  );
}
