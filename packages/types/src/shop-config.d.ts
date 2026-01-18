import { z } from "zod";
import { type PageComponent } from "./page";
import type { Locale } from "./constants";
export type NavItem = {
    label: string;
    url: string;
    children?: NavItem[];
};
export declare const navItemSchema: z.ZodType<NavItem>;
export type PageInfo = {
    slug: string;
    title: Record<Locale, string>;
    description?: Record<Locale, string>;
    image?: Record<Locale, string>;
    components: PageComponent[];
};
export declare const shopConfigSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    logo: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodRecord<z.ZodString, z.ZodString>]>>;
    contactInfo: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["sale", "rental"]>>;
    theme: z.ZodOptional<z.ZodString>;
    themeOverrides: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    template: z.ZodOptional<z.ZodString>;
    payment: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    billingProvider: z.ZodOptional<z.ZodString>;
    shipping: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    pageTitle: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
    pageDescription: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
    socialImage: z.ZodOptional<z.ZodString>;
    analytics: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodOptional<z.ZodBoolean>;
        provider: z.ZodString;
        id: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        provider: string;
        enabled?: boolean | undefined;
        id?: string | undefined;
    }, {
        provider: string;
        enabled?: boolean | undefined;
        id?: string | undefined;
    }>>;
    navItems: z.ZodOptional<z.ZodArray<z.ZodType<NavItem, z.ZodTypeDef, NavItem>, "many">>;
    pages: z.ZodOptional<z.ZodArray<z.ZodObject<{
        slug: z.ZodString;
        title: z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>;
        description: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
        image: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
        components: z.ZodArray<z.ZodTypeAny, "many">;
    }, "strict", z.ZodTypeAny, {
        slug: string;
        title: Partial<Record<"en" | "de" | "it", string>>;
        components: any[];
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    }, {
        slug: string;
        title: Partial<Record<"en" | "de" | "it", string>>;
        components: any[];
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    }>, "many">>;
    checkoutPage: z.ZodOptional<z.ZodArray<z.ZodTypeAny, "many">>;
    /**
     * Optional runtime application identifier for this shop.
     */
    runtimeAppId: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    type?: "sale" | "rental" | undefined;
    name?: string | undefined;
    logo?: string | Record<string, string> | undefined;
    contactInfo?: string | undefined;
    theme?: string | undefined;
    themeOverrides?: Record<string, string> | undefined;
    template?: string | undefined;
    payment?: string[] | undefined;
    billingProvider?: string | undefined;
    shipping?: string[] | undefined;
    pageTitle?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    pageDescription?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    socialImage?: string | undefined;
    analytics?: {
        provider: string;
        enabled?: boolean | undefined;
        id?: string | undefined;
    } | undefined;
    navItems?: NavItem[] | undefined;
    pages?: {
        slug: string;
        title: Partial<Record<"en" | "de" | "it", string>>;
        components: any[];
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    }[] | undefined;
    checkoutPage?: any[] | undefined;
    runtimeAppId?: string | undefined;
}, {
    type?: "sale" | "rental" | undefined;
    name?: string | undefined;
    logo?: string | Record<string, string> | undefined;
    contactInfo?: string | undefined;
    theme?: string | undefined;
    themeOverrides?: Record<string, string> | undefined;
    template?: string | undefined;
    payment?: string[] | undefined;
    billingProvider?: string | undefined;
    shipping?: string[] | undefined;
    pageTitle?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    pageDescription?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    socialImage?: string | undefined;
    analytics?: {
        provider: string;
        enabled?: boolean | undefined;
        id?: string | undefined;
    } | undefined;
    navItems?: NavItem[] | undefined;
    pages?: {
        slug: string;
        title: Partial<Record<"en" | "de" | "it", string>>;
        components: any[];
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    }[] | undefined;
    checkoutPage?: any[] | undefined;
    runtimeAppId?: string | undefined;
}>;
export type ShopConfig = z.infer<typeof shopConfigSchema>;
//# sourceMappingURL=shop-config.d.ts.map