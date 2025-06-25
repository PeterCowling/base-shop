export type Locale = "en" | "de" | "it";

export interface Translated {
  en: string;
  de: string;
  it: string;
}

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
  availability?: boolean;
}
