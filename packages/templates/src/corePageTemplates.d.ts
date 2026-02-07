import type { TemplateDescriptor } from "@acme/page-builder-core";
export declare const corePageTemplates: TemplateDescriptor[];
export interface LegalDocumentSection {
    heading: string;
    body: string;
}
export interface LegalDocument {
    title: string;
    sections: LegalDocumentSection[];
}
export interface ConsentConfig {
    id: string;
    label: string;
    description?: string;
    regions?: string[];
}
export interface VatConfig {
    id: string;
    label: string;
    description?: string;
    /** VAT rate as a decimal (e.g. 0.2 for 20%) */
    rate?: number;
    /** Prices displayed include VAT */
    inclusive?: boolean;
    registrationNumber?: string;
}
export interface LegalBundle {
    id: string;
    name: string;
    approved: boolean;
    rapidLaunch?: boolean;
    rapidLaunchOrder?: number;
    documents: {
        terms: LegalDocument;
        privacy: LegalDocument;
        accessibility: LegalDocument;
        returns: LegalDocument;
        consent: ConsentConfig;
        vat: VatConfig;
    };
}
export declare const legalBundles: LegalBundle[];
export declare function getRapidLaunchLegalBundles(): LegalBundle[];
export declare function pickRapidLaunchLegalBundle(): LegalBundle | undefined;
export declare const homePageTemplates: TemplateDescriptor[];
export declare const shopPageTemplates: TemplateDescriptor[];
export declare const productPageTemplates: TemplateDescriptor[];
export declare const checkoutPageTemplates: TemplateDescriptor[];
export declare const aboutPageTemplates: TemplateDescriptor[];
export declare const contactPageTemplates: TemplateDescriptor[];
export declare const faqPageTemplates: TemplateDescriptor[];
export declare const shippingReturnsPageTemplates: TemplateDescriptor[];
export declare const legalPageTemplates: TemplateDescriptor[];
export declare const termsPageTemplates: TemplateDescriptor[];
export declare const privacyPageTemplates: TemplateDescriptor[];
export declare const cookiePageTemplates: TemplateDescriptor[];
export declare const vatPageTemplates: TemplateDescriptor[];
export declare const accessibilityPageTemplates: TemplateDescriptor[];
export declare const returnsPageTemplates: TemplateDescriptor[];
//# sourceMappingURL=corePageTemplates.d.ts.map