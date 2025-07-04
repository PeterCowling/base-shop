import type { CartState } from "@types";
import { z } from "zod";
export declare const CART_COOKIE = "CART_STATE";
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
        title: string;
        image: string;
        sizes: string[];
        id: string;
        description: string;
        slug: string;
        price: number;
        deposit: number;
        forSale: boolean;
        forRental: boolean;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            from: string;
            to: string;
        }[] | undefined;
    }, {
        title: string;
        image: string;
        sizes: string[];
        id: string;
        description: string;
        slug: string;
        price: number;
        deposit: number;
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
    sku: {
        title: string;
        image: string;
        sizes: string[];
        id: string;
        description: string;
        slug: string;
        price: number;
        deposit: number;
        forSale: boolean;
        forRental: boolean;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            from: string;
            to: string;
        }[] | undefined;
    };
    qty: number;
    size?: string | undefined;
}, {
    sku: {
        title: string;
        image: string;
        sizes: string[];
        id: string;
        description: string;
        slug: string;
        price: number;
        deposit: number;
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
    qty: number;
    size?: string | undefined;
}>;
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
        title: string;
        image: string;
        sizes: string[];
        id: string;
        description: string;
        slug: string;
        price: number;
        deposit: number;
        forSale: boolean;
        forRental: boolean;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            from: string;
            to: string;
        }[] | undefined;
    }, {
        title: string;
        image: string;
        sizes: string[];
        id: string;
        description: string;
        slug: string;
        price: number;
        deposit: number;
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
    sku: {
        title: string;
        image: string;
        sizes: string[];
        id: string;
        description: string;
        slug: string;
        price: number;
        deposit: number;
        forSale: boolean;
        forRental: boolean;
        dailyRate?: number | undefined;
        weeklyRate?: number | undefined;
        monthlyRate?: number | undefined;
        availability?: {
            from: string;
            to: string;
        }[] | undefined;
    };
    qty: number;
    size?: string | undefined;
}, {
    sku: {
        title: string;
        image: string;
        sizes: string[];
        id: string;
        description: string;
        slug: string;
        price: number;
        deposit: number;
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
    qty: number;
    size?: string | undefined;
}>>;
/** Stringify cart → safe cookie/localStorage value */
export declare function encodeCartCookie(state: CartState): string;
/** Parse cookie string → typed cart (never throws) */
export declare function decodeCartCookie(raw?: string | null): CartState;
/** Builds a Set-Cookie header (used client-side via document.cookie too) */
export declare function asSetCookieHeader(value: string): string;
//# sourceMappingURL=cartCookie.d.ts.map