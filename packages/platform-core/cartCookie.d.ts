import { z } from "zod";
import type { CartState } from "@types";
export declare const CART_COOKIE = "CART_STATE";
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
        forSale: z.ZodDefault<z.ZodBoolean>;
        forRental: z.ZodDefault<z.ZodBoolean>;
        dailyRate: z.ZodOptional<z.ZodNumber>;
        weeklyRate: z.ZodOptional<z.ZodNumber>;
        monthlyRate: z.ZodOptional<z.ZodNumber>;
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
        image: z.ZodString;
        sizes: z.ZodArray<z.ZodString, "many">;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        slug: string;
        title: string;
        price: number;
        deposit: number;
        forSale: boolean;
        forRental: boolean;
        image: string;
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
        image: string;
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
    qty: z.ZodNumber;
    size: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sku?: {
        id: string;
        slug: string;
        title: string;
        price: number;
        deposit: number;
        forSale: boolean;
        forRental: boolean;
        image: string;
        sizes: string[];
        description: string;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            from: string;
            to: string;
        }[] | undefined;
    };
    qty?: number;
    size?: string;
}, {
    sku?: {
        id: string;
        slug: string;
        title: string;
        price: number;
        deposit: number;
        image: string;
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
    };
    qty?: number;
    size?: string;
}>;
/**
 * Schema for the full cart, keyed by SKU ID (string).
 */
export declare const cartStateSchema: z.ZodRecord<z.ZodString, z.ZodObject<{
    sku: z.ZodObject<{
        id: z.ZodString;
        slug: z.ZodString;
        title: z.ZodString;
        price: z.ZodNumber;
        deposit: z.ZodNumber;
        forSale: z.ZodDefault<z.ZodBoolean>;
        forRental: z.ZodDefault<z.ZodBoolean>;
        dailyRate: z.ZodOptional<z.ZodNumber>;
        weeklyRate: z.ZodOptional<z.ZodNumber>;
        monthlyRate: z.ZodOptional<z.ZodNumber>;
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
        image: z.ZodString;
        sizes: z.ZodArray<z.ZodString, "many">;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        slug: string;
        title: string;
        price: number;
        deposit: number;
        forSale: boolean;
        forRental: boolean;
        image: string;
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
        image: string;
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
    qty: z.ZodNumber;
    size: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    sku?: {
        id: string;
        slug: string;
        title: string;
        price: number;
        deposit: number;
        forSale: boolean;
        forRental: boolean;
        image: string;
        sizes: string[];
        description: string;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            from: string;
            to: string;
        }[] | undefined;
    };
    qty?: number;
    size?: string;
}, {
    sku?: {
        id: string;
        slug: string;
        title: string;
        price: number;
        deposit: number;
        image: string;
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
    };
    qty?: number;
    size?: string;
}>>;
/** Serialize cart state into a cookie-safe string. */
export declare function encodeCartCookie(state: CartState): string;
/**
 * Parse a cookie string back into cart state.
 *
 * – Always returns a value of type `CartState`
 * – Catches and logs malformed cookies instead of throwing
 */
export declare function decodeCartCookie(raw?: string | null): CartState;
/** Build the Set-Cookie header value for HTTP responses. */
export declare function asSetCookieHeader(value: string): string;
