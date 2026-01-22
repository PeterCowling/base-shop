import type { Locale } from "@acme/i18n/locales";
import type { CategoryCollectionTemplateProps } from "@acme/ui/components/templates/CategoryCollectionTemplate";
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
declare const moleculeEntries: {
    NewsletterForm: {
        component: import("react").NamedExoticComponent<NewsletterFormProps>;
    };
    PromoBanner: {
        component: import("react").NamedExoticComponent<PromoBannerProps>;
    };
    CategoryList: {
        component: import("react").NamedExoticComponent<CategoryCollectionTemplateProps>;
    };
};
export declare const moleculeRegistry: typeof moleculeEntries;
export type MoleculeBlockType = keyof typeof moleculeEntries;
export {};
//# sourceMappingURL=molecules.d.ts.map