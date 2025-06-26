export type Locale = "en" | "de" | "it";
export interface Translated {
  en: string;
  de: string;
  it: string;
}
/** Public shape stored in data/shops/<shop>/products.json */
export interface ProductPublication {
  id: string;
  sku: string;
  title: Translated;
  description: Translated;
  price: number;
  currency: string;
  images: string[];
  status: "draft" | "active" | "archived";
  shop: string;
  row_version: number;
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
//# sourceMappingURL=Product.d.ts.map
