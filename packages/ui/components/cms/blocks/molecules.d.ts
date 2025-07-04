/// <reference types="react" />
import type { Locale } from "@/i18n/locales";
import type { CategoryCollectionTemplateProps } from "../../templates/CategoryCollectionTemplate";
export interface NewsletterFormProps {
    action?: string;
    method?: string;
    placeholder?: string | Record<Locale, string>;
    submitLabel?: string | Record<Locale, string>;
    locale?: Locale;
}
export declare const NewsletterForm: import("react").NamedExoticComponent<NewsletterFormProps>;
export interface PromoBannerProps {
    text?: string | Record<Locale, string>;
    href?: string;
    buttonLabel?: string | Record<Locale, string>;
    locale?: Locale;
}
export declare const PromoBanner: import("react").NamedExoticComponent<PromoBannerProps>;
export declare const CategoryList: import("react").NamedExoticComponent<CategoryCollectionTemplateProps>;
export declare const moleculeRegistry: {
    readonly NewsletterForm: import("react").NamedExoticComponent<NewsletterFormProps>;
    readonly PromoBanner: import("react").NamedExoticComponent<PromoBannerProps>;
    readonly CategoryList: import("react").NamedExoticComponent<CategoryCollectionTemplateProps>;
};
export type MoleculeBlockType = keyof typeof moleculeRegistry;
