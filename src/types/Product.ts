// src/types/Product.ts
/* ========================================================================== */
/*  Canonical domain models shared across apps and packages                   */
/* ========================================================================== */

export interface Translated {
  en: string;
  de: string;
  it: string;
}

/** Public shape stored in data/shops/<shop>/products.json */
export interface ProductPublication {
  id: string; // unique ULID
  sku: string;
  title: Translated; // per-locale product name
  description: Translated; // markdown enabled
  price: number; // minor units (cents)
  currency: string; // ISO-4217, e.g. “EUR”
  images: string[]; // absolute URLs
  status: "draft" | "active" | "archived";
  shop: string;
  row_version: number; // optimistic locking
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
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
