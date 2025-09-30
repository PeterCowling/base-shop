"use client"; // i18n-exempt: Next.js directive string, not user-facing copy

import * as React from "react";
import { cn } from "../../utils/style";
import type { SKU } from "@acme/types";
import { ProductCard } from "./ProductCard";

export interface RecommendationCarouselProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** API endpoint providing recommended products. */
  endpoint?: string;
  /** Provide products directly instead of fetching. */
  products?: SKU[];
  /** Minimum number of items visible per slide. */
  minItems?: number;
  /** Maximum number of items visible per slide. */
  maxItems?: number;
  /** Items shown on desktop viewports */
  desktopItems?: number;
  /** Items shown on tablet viewports */
  tabletItems?: number;
  /** Items shown on mobile viewports */
  mobileItems?: number;
  /** Tailwind class controlling gap between slides */
  gapClassName?: string;
  /** Function to calculate individual slide width */
  getSlideWidth?: (itemsPerSlide: number) => string;
  /** Optional loading and error states */
  LoadingState?: React.ComponentType | null;
  ErrorState?: React.ComponentType | null;
  /** Show previous/next controls */
  showArrows?: boolean;
  /** Show pagination dots */
  showDots?: boolean;
  /** Loop around pages when navigating/autoplaying */
  loop?: boolean;
  /** Minimum tile height to keep rows visually consistent */
  tileMinHeight?: string | number;
}

/**
 * Horizontally scrollable carousel that fetches product
 * recommendations from an API. The number of visible items
 * adapts to the current viewport width and is clamped between
 * the provided `minItems` and `maxItems` values.
 */
export function RecommendationCarousel({
  endpoint,
  products: productsProp,
  minItems = 1,
  maxItems = 4,
  desktopItems,
  tabletItems,
  mobileItems,
  gapClassName = "gap-4",
  getSlideWidth = (n) => `${100 / n}%`,
  className,
  LoadingState,
  ErrorState,
  showArrows = true,
  showDots = true,
  loop = true,
  tileMinHeight,
  ...props
}: RecommendationCarouselProps) {
  const [products, setProducts] = React.useState<SKU[]>(productsProp ?? []);
  const [status, setStatus] = React.useState<'idle'|'loading'|'loaded'|'error'>(productsProp ? 'loaded' : 'idle');
  const [itemsPerSlide, setItemsPerSlide] = React.useState(
    desktopItems ?? minItems
  );
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const autoplayRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const indexRef = React.useRef(0);
  const [pageIndex, setPageIndex] = React.useState(0);
  const touchStartXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);
  const touchDxRef = React.useRef(0);
  const touchActiveRef = React.useRef(false);

  const stopAutoplay = React.useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);

  const startAutoplay = React.useCallback(() => {
    stopAutoplay();
    const pageCount = Math.max(1, Math.ceil(products.length / Math.max(1, itemsPerSlide)));
    if (!scrollerRef.current || pageCount <= 1) return;
    autoplayRef.current = setInterval(() => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const next = indexRef.current + 1;
      if (!loop && next >= pageCount) {
        stopAutoplay();
        return;
      }
      indexRef.current = next % pageCount;
      scroller.scrollTo({
        left: scroller.clientWidth * indexRef.current,
        behavior: "smooth",
      });
    }, 3000);
  }, [products.length, itemsPerSlide, stopAutoplay]);

  React.useEffect(() => {
    const calculateItems = () => {
      const width = window.innerWidth;
      if (desktopItems || tabletItems || mobileItems) {
        const chosen =
          width >= 1024
            ? desktopItems
            : width >= 768
            ? tabletItems
            : mobileItems;
        setItemsPerSlide(chosen ?? minItems);
        return;
      }
      const approxItemWidth = 320;
      const count = Math.floor(width / approxItemWidth);
      setItemsPerSlide(
        Math.min(maxItems, Math.max(minItems, count || minItems))
      );
    };
    calculateItems();
    window.addEventListener("resize", calculateItems);
    return () => window.removeEventListener("resize", calculateItems);
  }, [
    minItems,
    maxItems,
    desktopItems,
    tabletItems,
    mobileItems,
  ]);

  React.useEffect(() => {
    if (productsProp) {
      setProducts(productsProp);
      setStatus('loaded');
      return;
    }
    if (!endpoint) return;
    const load = async () => {
      setStatus('loading');
      try {
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.set("minItems", String(minItems));
        url.searchParams.set("maxItems", String(maxItems));
        const res = await fetch(url);
        if (!res.ok) { setStatus('error'); return; }
        const raw = await res.json();
        const list: SKU[] = Array.isArray(raw) ? raw : (raw?.items ?? []);
        setProducts(list);
        setStatus('loaded');
      } catch (err) {
        console.error(/* i18n-exempt -- UI-000 developer log [ttl=2025-12-31] */ "Failed loading recommendations", err);
        setStatus('error');
      }
    };
    void load();
  }, [endpoint, minItems, maxItems, productsProp]);

  const width = getSlideWidth(itemsPerSlide);

  const slideStyle = React.useMemo<React.CSSProperties>(
    () => ({ flex: `0 0 ${width}` }),
    [width]
  );

  React.useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);
  // Sync page index with scroll position
  React.useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onScroll = () => {
      const w = scroller.clientWidth || 1;
      const idx = Math.round(scroller.scrollLeft / w);
      indexRef.current = idx;
      setPageIndex(idx);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);

  const pageCount = Math.max(1, Math.ceil(products.length / Math.max(1, itemsPerSlide)));
  const gotoPage = (idx: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const clamped = loop ? (((idx % pageCount) + pageCount) % pageCount) : Math.max(0, Math.min(pageCount - 1, idx));
    indexRef.current = clamped;
    setPageIndex(clamped);
    scroller.scrollTo({ left: scroller.clientWidth * clamped, behavior: 'smooth' });
  };

  // Basic swipe (touch) support to page left/right
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollerRef.current) return;
    const t = e.touches[0];
    touchStartXRef.current = t.clientX;
    touchStartYRef.current = t.clientY;
    touchDxRef.current = 0;
    touchActiveRef.current = true;
    stopAutoplay();
  };
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchActiveRef.current) return;
    const t = e.touches[0];
    const sx = touchStartXRef.current ?? t.clientX;
    const sy = touchStartYRef.current ?? t.clientY;
    const dx = t.clientX - sx;
    const dy = t.clientY - sy;
    // If horizontal intent stronger than vertical, prevent vertical scrolling from stealing the gesture
    if (Math.abs(dx) > Math.abs(dy)) {
      e.preventDefault();
    }
    touchDxRef.current = dx;
  };
  const onTouchEnd = () => {
    if (!scrollerRef.current) return;
    const w = scrollerRef.current.clientWidth || 1;
    const dx = touchDxRef.current;
    const threshold = Math.max(50, w * 0.15);
    if (Math.abs(dx) > threshold) {
      const dir = dx < 0 ? 1 : -1;
      gotoPage(pageIndex + dir);
    } else {
      gotoPage(pageIndex); // snap back to current page
    }
    touchActiveRef.current = false;
    startAutoplay();
  };
  if (status === 'loading') return LoadingState ? <LoadingState /> : null;
  if (status === 'error') return ErrorState ? <ErrorState /> : null;
  if (!products.length) return null;

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      role="region"
      aria-label="Recommended products"
      tabIndex={0}
      onMouseEnter={stopAutoplay}
      onMouseLeave={startAutoplay}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); gotoPage(pageIndex - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); gotoPage(pageIndex + 1); }
      }}
      {...props}
    >
      {showArrows && pageCount > 1 && (
        <>
          {(() => {
            const canPrev = loop || pageIndex > 0;
            const canNext = loop || pageIndex < pageCount - 1;
            const btnBase = "rounded-full p-2 shadow-elevation-2 border border-border-2 bg-primary text-primary-fg hover:bg-primary/90";
            const disabledCls = "opacity-50 pointer-events-none";
            return (
              <>
                <button aria-label="Previous" onClick={() => gotoPage(pageIndex - 1)} className={`absolute left-2 top-1/2 z-10 -translate-y-1/2 ${btnBase} ${canPrev ? '' : disabledCls}`} disabled={!canPrev}>‹</button>
                <button aria-label="Next" onClick={() => gotoPage(pageIndex + 1)} className={`absolute right-2 top-1/2 z-10 -translate-y-1/2 ${btnBase} ${canNext ? '' : disabledCls}`} disabled={!canNext}>›</button>
              </>
            );
          })()}
        </>
      )}
      <div
        ref={scrollerRef}
        className={cn("flex snap-x overflow-x-auto pb-4 scroll-smooth", gapClassName)}
        style={{ touchAction: 'pan-y' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {products.map((p) => (
          <div
            key={p.id}
            /* eslint-disable-next-line react/forbid-dom-props -- UI-2610: Flex basis depends on computed itemsPerSlide; utility classes cannot express this dynamic value */
            style={slideStyle}
            className="snap-start"
          >
            <ProductCard product={p} className="h-full" minHeight={tileMinHeight}
            />
          </div>
        ))}
      </div>
      {showDots && pageCount > 1 && (
        <div className="mb-1 mt-2 flex justify-center gap-2" aria-live="polite" aria-atomic="true">
          {Array.from({ length: pageCount }).map((_, i) => (
            <button key={i} aria-label={`Go to page ${i + 1}`} className={cn("h-2 w-2 rounded-full", i === pageIndex ? "bg-primary" : "bg-muted") } onClick={() => gotoPage(i)} />
          ))}
        </div>
      )}
    </div>
  );
}
