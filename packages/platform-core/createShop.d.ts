import type { PageComponent } from "@types";
import { type Locale } from "@types";
import { z } from "zod";
export declare const createShopOptionsSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    logo: z.ZodOptional<z.ZodString>;
    contactInfo: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["sale", "rental"]>>;
    theme: z.ZodOptional<z.ZodString>;
    template: z.ZodOptional<z.ZodString>;
    payment: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    shipping: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    pageTitle: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
    pageDescription: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
    socialImage: z.ZodOptional<z.ZodString>;
    analytics: z.ZodOptional<z.ZodObject<{
        provider: z.ZodString;
        id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id?: string;
        provider?: string;
    }, {
        id?: string;
        provider?: string;
    }>>;
    navItems: z.ZodDefault<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        label?: string;
        url?: string;
    }, {
        label?: string;
        url?: string;
    }>, "many">>;
    pages: z.ZodDefault<z.ZodArray<z.ZodObject<{
        slug: z.ZodString;
        title: z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>;
        description: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
        image: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
        components: z.ZodArray<z.ZodAny, "many">;
    }, "strip", z.ZodTypeAny, {
        title?: Partial<Record<"en" | "de" | "it", string>>;
        image?: Partial<Record<"en" | "de" | "it", string>>;
        slug?: string;
        description?: Partial<Record<"en" | "de" | "it", string>>;
        components?: any[];
    }, {
        title?: Partial<Record<"en" | "de" | "it", string>>;
        image?: Partial<Record<"en" | "de" | "it", string>>;
        slug?: string;
        description?: Partial<Record<"en" | "de" | "it", string>>;
        components?: any[];
    }>, "many">>;
    checkoutPage: z.ZodDefault<z.ZodArray<z.ZodAny, "many">>;
}, "strip", z.ZodTypeAny, {
    type?: "sale" | "rental";
    template?: string;
    name?: string;
    logo?: string;
    contactInfo?: string;
    theme?: string;
    payment?: string[];
    shipping?: string[];
    pageTitle?: Partial<Record<"en" | "de" | "it", string>>;
    pageDescription?: Partial<Record<"en" | "de" | "it", string>>;
    socialImage?: string;
    analytics?: {
        id?: string;
        provider?: string;
    };
    navItems?: {
        label?: string;
        url?: string;
    }[];
    pages?: {
        title?: Partial<Record<"en" | "de" | "it", string>>;
        image?: Partial<Record<"en" | "de" | "it", string>>;
        slug?: string;
        description?: Partial<Record<"en" | "de" | "it", string>>;
        components?: any[];
    }[];
    checkoutPage?: any[];
}, {
    type?: "sale" | "rental";
    template?: string;
    name?: string;
    logo?: string;
    contactInfo?: string;
    theme?: string;
    payment?: string[];
    shipping?: string[];
    pageTitle?: Partial<Record<"en" | "de" | "it", string>>;
    pageDescription?: Partial<Record<"en" | "de" | "it", string>>;
    socialImage?: string;
    analytics?: {
        id?: string;
        provider?: string;
    };
    navItems?: {
        label?: string;
        url?: string;
    }[];
    pages?: {
        title?: Partial<Record<"en" | "de" | "it", string>>;
        image?: Partial<Record<"en" | "de" | "it", string>>;
        slug?: string;
        description?: Partial<Record<"en" | "de" | "it", string>>;
        components?: any[];
    }[];
    checkoutPage?: any[];
}>;
export interface CreateShopOptions {
    name?: string;
    logo?: string;
    contactInfo?: string;
    type?: "sale" | "rental";
    theme?: string;
    template?: string;
    payment?: string[];
    shipping?: string[];
    pageTitle?: Partial<Record<Locale, string>>;
    pageDescription?: Partial<Record<Locale, string>>;
    socialImage?: string;
    analytics?: {
        provider: string;
        id?: string;
    };
    navItems?: {
        label: string;
        url: string;
    }[];
    pages?: {
        slug: string;
        title: Partial<Record<Locale, string>>;
        description?: Partial<Record<Locale, string>>;
        image?: Partial<Record<Locale, string>>;
        components: PageComponent[];
    }[];
    checkoutPage?: PageComponent[];
}
/**
 * Create a new shop app and seed data.
 * Paths are resolved relative to the repository root.
 */
export declare function createShop(id: string, opts?: CreateShopOptions): void;
export interface DeployStatusBase {
    status: "pending" | "success" | "error";
    previewUrl?: string;
    instructions?: string;
    error?: string;
}
export interface DeployShopResult extends DeployStatusBase {
    status: "success" | "error";
    previewUrl: string;
}
export declare function deployShop(id: string, domain?: string): DeployShopResult;
export declare function listThemes(): string[];
