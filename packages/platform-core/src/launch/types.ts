import type { NavItem, PageComponent } from "@acme/types";

export type PageType =
  | "home"
  | "category"
  | "product"
  | "about"
  | "contact"
  | "faq"
  | "shipping-returns"
  | "terms"
  | "privacy"
  | "accessibility";

export interface Dimensions {
  width?: number;
  height?: number;
  depth?: number;
  unit?: string;
}

export interface Variant {
  id: string;
  name: string;
  sku?: string;
  price?: number;
  stock?: number;
  attributes?: Record<string, string>;
}

export interface LaunchProductInput {
  id: string;
  name: string;
  description: string;
  images: string[];
  price: number;
  currency: string;
  variants: Variant[];
  sizes?: string[];
  materials?: string[];
  weight?: number;
  dimensions?: Dimensions;
}

export interface DeriveContentInput {
  shop: {
    name: string;
    slug: string;
    locale: string;
    currency: string;
    description?: string;
    contactEmail: string;
    supportEmail: string;
    returnsAddress?: string;
  };
  theme: { id: string; colorOverride?: string };
  brandKit: { logoUrl: string; faviconUrl: string; socialImageUrl: string };
  products: LaunchProductInput[];
  commerce: { paymentTemplateId: string; shippingTemplateId: string; vatTemplateId: string };
  compliance: { legalBundleId: string; consentTemplateId: string };
  seo: { title: string; description: string };
}

export interface DerivedPage {
  type: PageType;
  slug: string;
  templateId: string;
  components: PageComponent[];
  seo: { title: string; description: string };
  warnings: string[];
}

export interface DeriveContentOutput {
  pages: DerivedPage[];
  navigation: { header: NavItem[]; footer: NavItem[] };
  derivationDurationMs: number;
  warningCount: number;
}
