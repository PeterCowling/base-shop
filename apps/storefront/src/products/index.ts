export interface AvailabilityWindow {
  from?: string;
  to?: string;
}

export interface Product {
  id: string;
  price: number;
  availability?: AvailabilityWindow[];
  tags?: string[];
}

export interface ProductFilters {
  /** Date that must fall within availability windows */
  availableOn?: Date;
  /** Minimum price (inclusive) */
  minPrice?: number;
  /** Maximum price (inclusive) */
  maxPrice?: number;
  /** Required tags */
  tags?: string[];
}

/**
 * Filter an array of products by optional availability, price and tag criteria.
 */
export function filterProducts(
  products: Product[],
  filters: ProductFilters = {}
): Product[] {
  const { availableOn, minPrice, maxPrice, tags } = filters;

  return products.filter((p) => {
    const availabilityMatch =
      !availableOn ||
      !p.availability ||
      p.availability.length === 0 ||
      p.availability.some((w) => {
        const from = w.from ? new Date(w.from).getTime() : undefined;
        const to = w.to ? new Date(w.to).getTime() : undefined;
        const time = availableOn.getTime();
        return (
          (from === undefined || time >= from) &&
          (to === undefined || time <= to)
        );
      });

    const priceMatch =
      (minPrice === undefined || p.price >= minPrice) &&
      (maxPrice === undefined || p.price <= maxPrice);

    const tagsMatch =
      !tags || tags.every((t) => (p.tags ?? []).includes(t));

    return availabilityMatch && priceMatch && tagsMatch;
  });
}
