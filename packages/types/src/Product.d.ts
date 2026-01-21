import { z } from "zod";

import { type Locale } from "./constants";
import type { MediaItem } from "./MediaItem";

export declare const localeSchema: z.ZodEnum<["en", "de", "it"]>;
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
    /** maximum number of rentals before retirement */
    wearAndTearLimit: z.ZodOptional<z.ZodNumber>;
    /** number of rentals between required maintenance */
    maintenanceCycle: z.ZodOptional<z.ZodNumber>;
    /** availability windows as ISO timestamps */
    availability: z.ZodOptional<z.ZodArray<z.ZodObject<{
        from: z.ZodString;
        to: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        from: string;
        to: string;
    }, {
        from: string;
        to: string;
    }>, "many">>;
    /** Ordered media gallery for the product */
    media: z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        title: z.ZodOptional<z.ZodString>;
        altText: z.ZodOptional<z.ZodString>;
        type: z.ZodEnum<["image", "video"]>;
    }, "strict", z.ZodTypeAny, {
        type: "image" | "video";
        url: string;
        title?: string | undefined;
        altText?: string | undefined;
    }, {
        type: "image" | "video";
        url: string;
        title?: string | undefined;
        altText?: string | undefined;
    }>, "many">;
    sizes: z.ZodArray<z.ZodString, "many">;
    description: z.ZodString;
}, "strict", z.ZodTypeAny, {
    id: string;
    slug: string;
    title: string;
    description: string;
    price: number;
    deposit: number;
    stock: number;
    forSale: boolean;
    forRental: boolean;
    media: {
        type: "image" | "video";
        url: string;
        title?: string | undefined;
        altText?: string | undefined;
    }[];
    sizes: string[];
    dailyRate?: number | undefined;
    weeklyRate?: number | undefined;
    monthlyRate?: number | undefined;
    wearAndTearLimit?: number | undefined;
    maintenanceCycle?: number | undefined;
    availability?: {
        from: string;
        to: string;
    }[] | undefined;
}, {
    id: string;
    slug: string;
    title: string;
    description: string;
    price: number;
    deposit: number;
    stock: number;
    media: {
        type: "image" | "video";
        url: string;
        title?: string | undefined;
        altText?: string | undefined;
    }[];
    sizes: string[];
    forSale?: boolean | undefined;
    forRental?: boolean | undefined;
    dailyRate?: number | undefined;
    weeklyRate?: number | undefined;
    monthlyRate?: number | undefined;
    wearAndTearLimit?: number | undefined;
    maintenanceCycle?: number | undefined;
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
    /** maximum number of rentals before retirement */
    wearAndTearLimit?: number;
    /** number of rentals between required maintenance */
    maintenanceCycle?: number;
    /** availability windows as ISO timestamps */
    availability?: {
        from: string;
        to: string;
    }[];
}
export type PublicationStatus = "draft" | "review" | "scheduled" | "active" | "archived";
export interface ProductPublication extends ProductCore {
    shop: string;
    status: PublicationStatus;
    row_version: number;
    /** Optional list of shops this product is published to (in addition to owner). */
    publishShops?: string[];
}
//# sourceMappingURL=Product.d.ts.map