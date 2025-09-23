export type Review = {
  id: string;
  sku: string;
  rating: number; // 1..5
  title?: string;
  body?: string;
  author?: string;
  createdAt: string;
};

export type ReviewsAdapter = {
  getForSku: (sku: string, limit?: number) => Promise<Review[]>;
};

let adapter: ReviewsAdapter | null = null;

export function configureReviewsAdapter(a: ReviewsAdapter) {
  adapter = a;
}

export async function getReviews(sku: string, limit = 10): Promise<Review[]> {
  if (!adapter) return [];
  try {
    return await adapter.getForSku(sku, limit);
  } catch {
    return [];
  }
}

