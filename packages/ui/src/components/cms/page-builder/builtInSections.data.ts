import { ulid } from "ulid";
import type { PageComponent } from "@acme/types";

// Built-in section variants surfaced in the Section Library selector.
// Each entry returns a concrete PageComponent for insertion.

export type BuiltInSection = {
  id: string;
  label: string;
  description?: string;
  // Always keep this as "/window.svg" so the selector uses our generated preview
  preview: string;
  // Encodes the base type and variant key understood by getPalettePreview
  previewType: string;
  build: () => PageComponent;
};

const headerVariants: BuiltInSection[] = [
  {
    id: "builtin:HeaderSection:minimal",
    label: "Header — Minimal",
    description: "Compact header with inline search",
    preview: "/window.svg",
    previewType: "HeaderSection:minimal",
    build: () => ({ id: ulid(), type: "HeaderSection", variant: "minimal", searchMode: "inline" } as any),
  },
  {
    id: "builtin:HeaderSection:centerLogo",
    label: "Header — Center Logo",
    description: "Centered logo with utilities",
    preview: "/window.svg",
    previewType: "HeaderSection:centerLogo",
    build: () => ({ id: ulid(), type: "HeaderSection", variant: "centerLogo", searchMode: "inline" } as any),
  },
  {
    id: "builtin:HeaderSection:splitUtilities",
    label: "Header — Split Utilities",
    description: "Nav and utilities split",
    preview: "/window.svg",
    previewType: "HeaderSection:splitUtilities",
    build: () => ({ id: ulid(), type: "HeaderSection", variant: "splitUtilities", searchMode: "inline" } as any),
  },
  {
    id: "builtin:HeaderSection:transparent",
    label: "Header — Transparent",
    description: "Overlay header on hero",
    preview: "/window.svg",
    previewType: "HeaderSection:transparent",
    build: () => ({ id: ulid(), type: "HeaderSection", variant: "transparent", searchMode: "inline" } as any),
  },
  {
    id: "builtin:HeaderSection:sticky",
    label: "Header — Sticky",
    description: "Sticks to top on scroll",
    preview: "/window.svg",
    previewType: "HeaderSection:sticky",
    build: () => ({ id: ulid(), type: "HeaderSection", variant: "sticky", searchMode: "inline" } as any),
  },
];

const footerVariants: BuiltInSection[] = [
  {
    id: "builtin:FooterSection:simple",
    label: "Footer — Simple",
    description: "Single-row footer",
    preview: "/window.svg",
    previewType: "FooterSection:simple",
    build: () => ({ id: ulid(), type: "FooterSection", variant: "simple" } as any),
  },
  {
    id: "builtin:FooterSection:multiColumn",
    label: "Footer — Multi-Column",
    description: "Four-column footer",
    preview: "/window.svg",
    previewType: "FooterSection:multiColumn",
    build: () => ({ id: ulid(), type: "FooterSection", variant: "multiColumn" } as any),
  },
  {
    id: "builtin:FooterSection:newsletter",
    label: "Footer — Newsletter",
    description: "Footer with subscribe form",
    preview: "/window.svg",
    previewType: "FooterSection:newsletter",
    build: () => ({ id: ulid(), type: "FooterSection", variant: "newsletter" } as any),
  },
  {
    id: "builtin:FooterSection:social",
    label: "Footer — Social",
    description: "Centered social links",
    preview: "/window.svg",
    previewType: "FooterSection:social",
    build: () => ({ id: ulid(), type: "FooterSection", variant: "social" } as any),
  },
  {
    id: "builtin:FooterSection:legalHeavy",
    label: "Footer — Legal",
    description: "Legal-focused footer",
    preview: "/window.svg",
    previewType: "FooterSection:legalHeavy",
    build: () => ({ id: ulid(), type: "FooterSection", variant: "legalHeavy" } as any),
  },
];

const otherSections: BuiltInSection[] = [
  {
    id: "builtin:ConsentSection",
    label: "Consent Banner",
    description: "Cookie consent prompt",
    preview: "/window.svg",
    previewType: "ConsentSection",
    build: () => ({ id: ulid(), type: "ConsentSection" } as any),
  },
  {
    id: "builtin:AnalyticsPixelsSection",
    label: "Analytics (GA4)",
    description: "Loads GA4 after consent",
    preview: "/window.svg",
    previewType: "AnalyticsPixelsSection",
    build: () => ({ id: ulid(), type: "AnalyticsPixelsSection" } as any),
  },
  {
    id: "builtin:StructuredDataSection",
    label: "Structured Data — Breadcrumbs",
    description: "Injects BreadcrumbList JSON-LD",
    preview: "/window.svg",
    previewType: "StructuredDataSection",
    build: () => ({ id: ulid(), type: "StructuredDataSection", breadcrumbs: true } as any),
  },
  {
    id: "builtin:RentalAvailabilitySection",
    label: "Rental — Availability",
    description: "Check rental dates availability",
    preview: "/window.svg",
    previewType: "RentalAvailabilitySection",
    build: () => ({ id: ulid(), type: "RentalAvailabilitySection", sku: "sku_123" } as any),
  },
  {
    id: "builtin:RentalTermsSection",
    label: "Rental — Terms",
    description: "Accept terms, insurance, deposit",
    preview: "/window.svg",
    previewType: "RentalTermsSection",
    build: () => ({ id: ulid(), type: "RentalTermsSection", sku: "sku_123", termsVersion: "1.0" } as any),
  },
];

export const builtInSections: BuiltInSection[] = [
  ...headerVariants,
  ...footerVariants,
  ...otherSections,
];
