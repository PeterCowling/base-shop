export const SECTION_IDS = {
  sellerInformation: "seller-information",
  scopeAndDefinitions: "scope-and-definitions",
  products: "products",
  ordering: "ordering",
  pricesVatPromotions: "prices-vat-promotions",
  payment: "payment",
  deliveryShippingRestrictions: "delivery",
  withdrawal: "withdrawal",
  returnsCondition: "returns-condition",
  defective: "defective",
  returnsAddress: "returns-address",
  customerService: "customer-service",
  liability: "liability",
  forceMajeure: "force-majeure",
  governingLaw: "governing-law",
  changes: "changes",
  annexA: "annex-a",
} as const;

export type SectionIdKey = keyof typeof SECTION_IDS;
