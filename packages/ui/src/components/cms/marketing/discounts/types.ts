export type DiscountType = "percentage" | "fixed";

export interface DiscountFormValues {
  code: string;
  type: DiscountType;
  value: number;
  minPurchase: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  appliesTo: string;
}

export interface DiscountPreviewData {
  code: string;
  label: string;
  validity: string;
  appliesTo: string;
  usageLabel: string;
}

export const defaultDiscountValues: DiscountFormValues = {
  code: "",
  type: "percentage",
  value: 10,
  minPurchase: 0,
  startDate: "",
  endDate: "",
  usageLimit: 0,
  appliesTo: "",
};

export function getDiscountPreview(
  values: DiscountFormValues,
  // Match the signature returned by @acme/i18n `useTranslations`
  t?: (key: string, params?: Record<string, string | number>) => string
): DiscountPreviewData {
  const amountLabel =
    values.type === "percentage"
      ? (t ? (t("cms.marketing.discounts.offer.percentage", { value: values.value }) as string) : `${values.value}% off`) // i18n-exempt -- INTL-000 fallback label [ttl=2026-03-31]
      : (t ? (t("cms.marketing.discounts.offer.fixed", { amount: values.value.toFixed(2) }) as string) : `$${values.value.toFixed(2)} off`); // i18n-exempt -- INTL-000 fallback label [ttl=2026-03-31]

  const validity = values.startDate
    ? values.endDate
      ? (t ? (t("cms.marketing.discounts.validity.range", { start: values.startDate, end: values.endDate }) as string) : `${values.startDate} → ${values.endDate}`) // i18n-exempt -- INTL-000 fallback label [ttl=2026-03-31]
      : (t ? (t("cms.marketing.discounts.validity.starts", { date: values.startDate }) as string) : `Starts ${values.startDate}`) // i18n-exempt -- INTL-000 fallback label [ttl=2026-03-31]
    : (t ? (t("cms.marketing.discounts.validity.pending") as string) : "Schedule pending"); // i18n-exempt -- INTL-000 fallback label [ttl=2026-03-31]

  const usageLabel =
    values.usageLimit > 0
      ? (t ? (t("cms.marketing.discounts.usage.remaining", { count: values.usageLimit }) as string) : `${values.usageLimit} uses remaining`) // i18n-exempt -- INTL-000 fallback label [ttl=2026-03-31]
      : (t ? (t("cms.marketing.discounts.usage.unlimited") as string) : "Unlimited use"); // i18n-exempt -- INTL-000 fallback label [ttl=2026-03-31]

  return {
    // i18n-exempt: placeholder code for previews
    code: values.code || "NEWCODE",
    label: amountLabel,
    validity,
    appliesTo: values.appliesTo || (t ? (t("cms.marketing.discounts.appliesTo.entireCatalog") as string) : "Entire catalog"), // i18n-exempt -- INTL-000 fallback label [ttl=2026-03-31]
    usageLabel,
  };
}
