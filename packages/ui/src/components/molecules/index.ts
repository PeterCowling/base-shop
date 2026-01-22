"use client";

// DEPRECATED: Import from @acme/design-system/molecules instead
// This shim will be removed in the next major version.

if (process.env.NODE_ENV === "development") {
  console.warn(
    "[@acme/ui] Importing from '@acme/ui/molecules' or '@acme/ui/components/molecules' is deprecated. " +
      "Please import from '@acme/design-system/molecules' instead."
  );
}

// Re-export all molecules from design-system
export {
  AccordionMolecule,
  type BreadcrumbItem,
  Breadcrumbs,
  CodeBlock,
  CurrencySwitcher,
  // Note: FormField in design-system is exported as FormFieldMolecule to avoid collision
  // with atoms/FormField. Re-export with original name for backward compat.
  FormFieldMolecule as FormField,
  Image360Viewer,
  LanguageSwitcher,
  MediaSelector,
  PaginationControl,
  PaymentMethodSelector,
  PriceCluster,
  PromoCodeInput,
  QuantityInput,
  RatingSummary,
  SearchBar,
  SustainabilityBadgeCluster,
} from "@acme/design-system/molecules";
