export type SKU = {
  id: string;
  slug: string;
  title: string;
  price: number;
  deposit: number;
  image: string;
  sizes: string[];
  description: string;
};
/** Mock catalogue (3 items) */
export declare const PRODUCTS: SKU[];
/** Helper to fetch one product (could be remote PIM later) */
export declare function getProductBySlug(slug: string): SKU | undefined;
export interface ProductCore {
  id: string;
  sku: string;
  title: Record<string, string>;
  price: number;
  currency: string;
  images: string[];
  created_at: string;
  updated_at: string;
  rentalTerms?: string;
  deposit?: number;
  /** daily rental rate in minor currency units */
  dailyRate?: number;
  /** weekly rental rate in minor currency units */
  weeklyRate?: number;
  /** monthly rental rate in minor currency units */
  monthlyRate?: number;
  /** availability windows as ISO timestamps */
  availability?: { from: string; to: string }[];
}
export type PublicationStatus = "draft" | "live" | "retired";
export interface ProductPublication extends ProductCore {
  shop: string;
  status: PublicationStatus;
  row_version: number;
}
