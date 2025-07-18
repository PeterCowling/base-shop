import { LOCALES, type Locale } from "@acme/i18n";
import { z } from "zod";

export type { Locale } from "@acme/i18n";

export const localeSchema = z.enum(LOCALES);

/** Runtime validator + compile-time source of truth */
export const skuSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  /** Unit price in minor currency units (e.g. cents) */
  price: z.number(),
  /** Refundable deposit, required by business rules */
  deposit: z.number(),
  /** Item can be sold */
  forSale: z.boolean().default(true),
  /** Item can be rented */
  forRental: z.boolean().default(false),
  /** daily rental rate in minor currency units */
  dailyRate: z.number().optional(),
  /** weekly rental rate in minor currency units */
  weeklyRate: z.number().optional(),
  /** monthly rental rate in minor currency units */
  monthlyRate: z.number().optional(),
  /** availability windows as ISO timestamps */
  availability: z
    .array(z.object({ from: z.string(), to: z.string() }))
    .optional(),
  image: z.string(),
  sizes: z.array(z.string()),
  description: z.string(),
});

export type SKU = z.infer<typeof skuSchema>;

export type Translated<T extends string = string> = Record<Locale, T>;

export interface ProductCore {
  id: string; // ULID
  sku: string;
  title: Translated;
  description: Translated;
  price: number; // minor units (e.g. cents)
  currency: string; // ISO-4217 code
  images: string[];
  created_at: string; // ISO timestamp
  updated_at: string;
  rentalTerms?: string;
  deposit?: number;
  forSale?: boolean;
  forRental?: boolean;
  /** daily rental rate in minor currency units */
  dailyRate?: number;
  /** weekly rental rate in minor currency units */
  weeklyRate?: number;
  /** monthly rental rate in minor currency units */
  monthlyRate?: number;
  /** availability windows as ISO timestamps */
  availability?: { from: string; to: string }[];
}

export type PublicationStatus = "draft" | "active" | "archived";

export interface ProductPublication extends ProductCore {
  shop: string; // e.g. "abc"
  status: PublicationStatus;
  row_version: number;
}
