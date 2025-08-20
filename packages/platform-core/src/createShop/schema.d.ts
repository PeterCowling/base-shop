import type { PageComponent } from "@acme/types";
import { z } from "zod";
export interface NavItem {
    label: string;
    url: string;
    children?: NavItem[];
}
export declare const createShopOptionsSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    logo: z.ZodOptional<z.ZodString>;
    contactInfo: z.ZodOptional<z.ZodString>;
    type: z.ZodOptional<z.ZodEnum<["sale", "rental"]>>;
    theme: z.ZodOptional<z.ZodString>;
    themeOverrides: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    template: z.ZodOptional<z.ZodString>;
    payment: z.ZodDefault<z.ZodArray<z.ZodEnum<["stripe", "paypal"]>, "many">>;
    shipping: z.ZodDefault<z.ZodArray<z.ZodEnum<["dhl", "ups", "premier-shipping"]>, "many">>;
    tax: z.ZodDefault<z.ZodEnum<["taxjar"]>>;
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
    sanityBlog: z.ZodOptional<z.ZodObject<{
        projectId: z.ZodString;
        dataset: z.ZodString;
        token: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        projectId: string;
        dataset: string;
        token: string;
    }, {
        projectId: string;
        dataset: string;
        token: string;
    }>>;
    enableEditorial: z.ZodOptional<z.ZodBoolean>;
    enableSubscriptions: z.ZodOptional<z.ZodBoolean>;
    navItems: z.ZodDefault<z.ZodArray<z.ZodType<NavItem, z.ZodTypeDef, NavItem>, "many">>;
    pages: z.ZodDefault<z.ZodArray<z.ZodObject<{
        slug: z.ZodString;
        title: z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>;
        description: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
        image: z.ZodOptional<z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>>;
        components: z.ZodArray<z.ZodObject<{
            file: z.ZodString;
            componentName: z.ZodString;
            oldChecksum: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            newChecksum: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            file: string;
            componentName: string;
            newChecksum: string;
            oldChecksum?: string | null | undefined;
        }, {
            file: string;
            componentName: string;
            newChecksum: string;
            oldChecksum?: string | null | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        slug: string;
        title: Partial<Record<"en" | "de" | "it", string>>;
        components: {
            file: string;
            componentName: string;
            newChecksum: string;
            oldChecksum?: string | null | undefined;
        }[];
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    }, {
        slug: string;
        title: Partial<Record<"en" | "de" | "it", string>>;
        components: {
            file: string;
            componentName: string;
            newChecksum: string;
            oldChecksum?: string | null | undefined;
        }[];
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    }>, "many">>;
    checkoutPage: z.ZodDefault<z.ZodArray<z.ZodObject<{
        file: z.ZodString;
        componentName: z.ZodString;
        oldChecksum: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        newChecksum: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        file: string;
        componentName: string;
        newChecksum: string;
        oldChecksum?: string | null | undefined;
    }, {
        file: string;
        componentName: string;
        newChecksum: string;
        oldChecksum?: string | null | undefined;
    }>, "many">>;
}, "strict", z.ZodTypeAny, {
    themeOverrides: Record<string, string>;
    payment: ("stripe" | "paypal")[];
    shipping: ("dhl" | "ups" | "premier-shipping")[];
    tax: "taxjar";
    navItems: NavItem[];
    pages: {
        slug: string;
        title: Partial<Record<"en" | "de" | "it", string>>;
        components: {
            file: string;
            componentName: string;
            newChecksum: string;
            oldChecksum?: string | null | undefined;
        }[];
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    }[];
    checkoutPage: {
        file: string;
        componentName: string;
        newChecksum: string;
        oldChecksum?: string | null | undefined;
    }[];
    name?: string | undefined;
    logo?: string | undefined;
    contactInfo?: string | undefined;
    type?: "sale" | "rental" | undefined;
    theme?: string | undefined;
    template?: string | undefined;
    pageTitle?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    pageDescription?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    socialImage?: string | undefined;
    analytics?: {
        provider: string;
        enabled?: boolean | undefined;
        id?: string | undefined;
    } | undefined;
    sanityBlog?: {
        projectId: string;
        dataset: string;
        token: string;
    } | undefined;
    enableEditorial?: boolean | undefined;
    enableSubscriptions?: boolean | undefined;
}, {
    name?: string | undefined;
    logo?: string | undefined;
    contactInfo?: string | undefined;
    type?: "sale" | "rental" | undefined;
    theme?: string | undefined;
    themeOverrides?: Record<string, string> | undefined;
    template?: string | undefined;
    payment?: ("stripe" | "paypal")[] | undefined;
    shipping?: ("dhl" | "ups" | "premier-shipping")[] | undefined;
    tax?: "taxjar" | undefined;
    pageTitle?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    pageDescription?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    socialImage?: string | undefined;
    analytics?: {
        provider: string;
        enabled?: boolean | undefined;
        id?: string | undefined;
    } | undefined;
    sanityBlog?: {
        projectId: string;
        dataset: string;
        token: string;
    } | undefined;
    enableEditorial?: boolean | undefined;
    enableSubscriptions?: boolean | undefined;
    navItems?: NavItem[] | undefined;
    pages?: {
        slug: string;
        title: Partial<Record<"en" | "de" | "it", string>>;
        components: {
            file: string;
            componentName: string;
            newChecksum: string;
            oldChecksum?: string | null | undefined;
        }[];
        description?: Partial<Record<"en" | "de" | "it", string>> | undefined;
        image?: Partial<Record<"en" | "de" | "it", string>> | undefined;
    }[] | undefined;
    checkoutPage?: {
        file: string;
        componentName: string;
        newChecksum: string;
        oldChecksum?: string | null | undefined;
    }[] | undefined;
}>;
export type CreateShopOptions = z.infer<typeof createShopOptionsSchema>;
export type PreparedCreateShopOptions = Required<Omit<CreateShopOptions, "analytics" | "checkoutPage" | "sanityBlog" | "enableEditorial" | "enableSubscriptions">> & {
    analytics?: CreateShopOptions["analytics"];
    sanityBlog?: CreateShopOptions["sanityBlog"];
    enableEditorial: boolean;
    enableSubscriptions: boolean;
    checkoutPage: PageComponent[];
};
/** Parse and populate option defaults. */
export declare function prepareOptions(id: string, opts: CreateShopOptions): PreparedCreateShopOptions;
//# sourceMappingURL=schema.d.ts.map