import { z } from "zod";
import { type Locale } from "./constants";
import type { MediaItem } from "./MediaItem";
export type { Locale } from "./constants";
export declare const localeSchema: z.ZodEnum<["en", "de", "it"]>;
/** Runtime validator + compile-time source of truth */
export declare const skuSchema: z.ZodObject<{
    id: z.ZodString;
    slug: z.ZodString;
    title: z.ZodString;
    /** Unit price in minor currency units (e.g. cents) */
    price: z.ZodNumber;
    /** Refundable deposit, required by business rules */
    deposit: z.ZodNumber;
    /** Available stock count */
    stock: z.ZodNumber;
    /** Item can be sold */
    forSale: z.ZodDefault<z.ZodBoolean>;
    /** Item can be rented */
    forRental: z.ZodDefault<z.ZodBoolean>;
    /** daily rental rate in minor currency units */
    dailyRate: z.ZodOptional<z.ZodNumber>;
    /** weekly rental rate in minor currency units */
    weeklyRate: z.ZodOptional<z.ZodNumber>;
    /** monthly rental rate in minor currency units */
    monthlyRate: z.ZodOptional<z.ZodNumber>;
    /** availability windows as ISO timestamps */
    availability: z.ZodOptional<z.ZodArray<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        from: string;
        to: string;
    }, {
        from: string;
        to: string;
    }>, "many">>;
    media: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        altText: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["image", "video"]>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        title?: string | undefined;
        altText?: string | undefined;
        type: "image" | "video";
    }, {
        url: string;
        title?: string | undefined;
        altText?: string | undefined;
        type: "image" | "video";
    }>, "many">;
    sizes: z.ZodArray<z.ZodString, "many">;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    slug: string;
    title: string;
    price: number;
    deposit: number;
    stock: number;
    forSale: boolean;
    forRental: boolean;
    media: {
        url: string;
        title?: string | undefined;
        altText?: string | undefined;
        type: "image" | "video";
    }[];
    sizes: string[];
    description: string;
    dailyRate?: number | undefined;
    weeklyRate?: number | undefined;
    monthlyRate?: number | undefined;
    availability?: {
        from: string;
        to: string;
    }[] | undefined;
}, {
    id: string;
    slug: string;
    title: string;
    price: number;
    deposit: number;
    stock: number;
    media: {
        url: string;
        title?: string | undefined;
        altText?: string | undefined;
        type: "image" | "video";
    }[];
    sizes: string[];
    description: string;
    forSale?: boolean | undefined;
    forRental?: boolean | undefined;
    dailyRate?: number | undefined;
    weeklyRate?: number | undefined;
    monthlyRate?: number | undefined;
    availability?: {
        from: string;
        to: string;
    }[] | undefined;
}>;
export type SKU = z.infer<typeof skuSchema>;
export type Translated<T extends string = string> = Record<Locale, T>;
export interface ProductCore {
    id: string;
    sku: string;
    title: Translated;
    description: Translated;
    price: number;
    currency: string;
    media: MediaItem[];
    created_at: string;
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
    availability?: {
        from: string;
        to: string;
    }[];
}
export type PublicationStatus =
  | "draft"
  | "review"
  | "scheduled"
  | "active"
  | "archived";
export interface ProductPublication extends ProductCore {
    shop: string;
    status: PublicationStatus;
    row_version: number;
}
//# sourceMappingURL=Product.d.ts.map