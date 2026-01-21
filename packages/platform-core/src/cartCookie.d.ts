import { type z } from "zod";

export type { CartLine, CartState } from "./cart";
export declare const CART_COOKIE = "__Host-CART_ID";
/**
 * Schema for one cart line.  We keep the schema definition simple and
 * let Zod infer its own TS type; later we cast the parsed output to
 * `CartLine` / `CartState` so the rest of the codebase stays strongly
 * typed without running into “required vs optional” variance issues.
 */
export declare const cartLineSchema: z.ZodObject<{
    sku: z.ZodObject<{
        id: z.ZodString;
        slug: z.ZodString;
        title: z.ZodString;
        price: z.ZodNumber;
        deposit: z.ZodNumber;
        stock: z.ZodNumber;
        forSale: z.ZodDefault<z.ZodBoolean>;
        forRental: z.ZodDefault<z.ZodBoolean>;
        dailyRate: z.ZodOptional<z.ZodNumber>;
        weeklyRate: z.ZodOptional<z.ZodNumber>;
        monthlyRate: z.ZodOptional<z.ZodNumber>;
        wearAndTearLimit: z.ZodOptional<z.ZodNumber>;
        maintenanceCycle: z.ZodOptional<z.ZodNumber>;
        availability: z.ZodOptional<z.ZodArray<z.ZodObject<{
            from: z.ZodString;
            to: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            to: string;
            from: string;
        }, {
            to: string;
            from: string;
        }>, "many">>;
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
        price: number;
        description: string;
        media: {
            type: "image" | "video";
            url: string;
            title?: string | undefined;
            altText?: string | undefined;
        }[];
        deposit: number;
        stock: number;
        forSale: boolean;
        forRental: boolean;
        sizes: string[];
        wearAndTearLimit?: number | undefined;
        maintenanceCycle?: number | undefined;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            to: string;
            from: string;
        }[] | undefined;
    }, {
        id: string;
        slug: string;
        title: string;
        price: number;
        description: string;
        media: {
            type: "image" | "video";
            url: string;
            title?: string | undefined;
            altText?: string | undefined;
        }[];
        deposit: number;
        stock: number;
        sizes: string[];
        wearAndTearLimit?: number | undefined;
        maintenanceCycle?: number | undefined;
        forSale?: boolean | undefined;
        forRental?: boolean | undefined;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            to: string;
            from: string;
        }[] | undefined;
    }>;
    qty: z.ZodNumber;
    size: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    sku: {
        id: string;
        slug: string;
        title: string;
        price: number;
        description: string;
        media: {
            type: "image" | "video";
            url: string;
            title?: string | undefined;
            altText?: string | undefined;
        }[];
        deposit: number;
        stock: number;
        forSale: boolean;
        forRental: boolean;
        sizes: string[];
        wearAndTearLimit?: number | undefined;
        maintenanceCycle?: number | undefined;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            to: string;
            from: string;
        }[] | undefined;
    };
    qty: number;
    size?: string | undefined;
}, {
    sku: {
        id: string;
        slug: string;
        title: string;
        price: number;
        description: string;
        media: {
            type: "image" | "video";
            url: string;
            title?: string | undefined;
            altText?: string | undefined;
        }[];
        deposit: number;
        stock: number;
        sizes: string[];
        wearAndTearLimit?: number | undefined;
        maintenanceCycle?: number | undefined;
        forSale?: boolean | undefined;
        forRental?: boolean | undefined;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            to: string;
            from: string;
        }[] | undefined;
    };
    qty: number;
    size?: string | undefined;
}>;
/**
 * Schema for the full cart, keyed by `${sku.id}` or `${sku.id}:${size}`.
 */
export declare const cartStateSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    sku: z.ZodObject<{
        id: z.ZodString;
        slug: z.ZodString;
        title: z.ZodString;
        price: z.ZodNumber;
        deposit: z.ZodNumber;
        stock: z.ZodNumber;
        forSale: z.ZodDefault<z.ZodBoolean>;
        forRental: z.ZodDefault<z.ZodBoolean>;
        dailyRate: z.ZodOptional<z.ZodNumber>;
        weeklyRate: z.ZodOptional<z.ZodNumber>;
        monthlyRate: z.ZodOptional<z.ZodNumber>;
        wearAndTearLimit: z.ZodOptional<z.ZodNumber>;
        maintenanceCycle: z.ZodOptional<z.ZodNumber>;
        availability: z.ZodOptional<z.ZodArray<z.ZodObject<{
            from: z.ZodString;
            to: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            to: string;
            from: string;
        }, {
            to: string;
            from: string;
        }>, "many">>;
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
        price: number;
        description: string;
        media: {
            type: "image" | "video";
            url: string;
            title?: string | undefined;
            altText?: string | undefined;
        }[];
        deposit: number;
        stock: number;
        forSale: boolean;
        forRental: boolean;
        sizes: string[];
        wearAndTearLimit?: number | undefined;
        maintenanceCycle?: number | undefined;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            to: string;
            from: string;
        }[] | undefined;
    }, {
        id: string;
        slug: string;
        title: string;
        price: number;
        description: string;
        media: {
            type: "image" | "video";
            url: string;
            title?: string | undefined;
            altText?: string | undefined;
        }[];
        deposit: number;
        stock: number;
        sizes: string[];
        wearAndTearLimit?: number | undefined;
        maintenanceCycle?: number | undefined;
        forSale?: boolean | undefined;
        forRental?: boolean | undefined;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            to: string;
            from: string;
        }[] | undefined;
    }>;
    qty: z.ZodNumber;
    size: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    sku: {
        id: string;
        slug: string;
        title: string;
        price: number;
        description: string;
        media: {
            type: "image" | "video";
            url: string;
            title?: string | undefined;
            altText?: string | undefined;
        }[];
        deposit: number;
        stock: number;
        forSale: boolean;
        forRental: boolean;
        sizes: string[];
        wearAndTearLimit?: number | undefined;
        maintenanceCycle?: number | undefined;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            to: string;
            from: string;
        }[] | undefined;
    };
    qty: number;
    size?: string | undefined;
}, {
    sku: {
        id: string;
        slug: string;
        title: string;
        price: number;
        description: string;
        media: {
            type: "image" | "video";
            url: string;
            title?: string | undefined;
            altText?: string | undefined;
        }[];
        deposit: number;
        stock: number;
        sizes: string[];
        wearAndTearLimit?: number | undefined;
        maintenanceCycle?: number | undefined;
        forSale?: boolean | undefined;
        forRental?: boolean | undefined;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            to: string;
            from: string;
        }[] | undefined;
    };
    qty: number;
    size?: string | undefined;
}>>;
/**
 * Serialize a cart ID into a signed cookie value.
 */
export declare function encodeCartCookie(value: string): string;
/**
 * Verify and extract the payload from a signed cookie value. JSON payloads are
 * parsed and returned as objects, otherwise the raw string is returned. Returns
 * `null` when the cookie is missing or invalid.
 */
export declare function decodeCartCookie(raw?: string | null): unknown;
/** Build the Set-Cookie header value for HTTP responses. */
export declare function asSetCookieHeader(
  value: string,
  maxAge?: number | null,
  options?: {
    domain?: string;
  }
): string;
