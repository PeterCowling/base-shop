import * as React from "react";
import { cn } from "../../utils/style";
import { Product, ProductCard } from "./ProductCard";

export interface ProductCarouselProps
  extends React.HTMLAttributes<HTMLDivElement> {
  products: Product[];
  /** Minimum number of items to show at once */
  minItems?: number;
  /** Maximum number of items to show at once */
  maxItems?: number;
  /** flex gap class applied to the inner scroller */
  gapClassName?: string;
  /**
   * Function to calculate the width of each slide based on
   * the current itemsPerSlide value. Should return a CSS
   * width value such as "33.333%".
   */
  getSlideWidth?: (itemsPerSlide: number) => string;
  className?: string;
}

/**
 * Horizontally scrollable carousel for product cards.
 * The number of items per slide adapts to the component width
 * and stays within the provided `minItems`/`maxItems` range.
 */
export function ProductCarousel({
  products,
  minItems = 1,
  maxItems = 5,
  gapClassName = "gap-4",
  getSlideWidth = (n) => `${100 / n}%`,
  className,
  ...props
}: ProductCarouselProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [itemsPerSlide, setItemsPerSlide] = React.useState(minItems);

  React.useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined")
      return;
    const el = containerRef.current;
    const ITEM_WIDTH = 250;
    const update = () => {
      const width = el.clientWidth;
      const ideal = Math.floor(width / ITEM_WIDTH) || 1;
      const clamped = Math.max(minItems, Math.min(maxItems, ideal));
      setItemsPerSlide(clamped);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [minItems, maxItems]);

  const width = getSlideWidth(itemsPerSlide);
  const slideStyle = { flex: `0 0 ${width}` } as React.CSSProperties;
  return (
    <div
      ref={containerRef}
      className={cn("overflow-hidden", className)}
      {...props}
    >
      <div className={cn("flex snap-x overflow-x-auto pb-4", gapClassName)}>
        {products.map((p) => (
          <div key={p.id} style={slideStyle} className="snap-start">
            <ProductCard product={p} className="h-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
