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
  // i18n-exempt: default placeholder; UI surfaces will translate or override
  appliesTo: "Entire catalog",
};

export function getDiscountPreview(
  values: DiscountFormValues
): DiscountPreviewData {
  const amountLabel =
    values.type === "percentage"
      ? `${values.value}% off`
      : `$${values.value.toFixed(2)} off`;

  const validity = values.startDate
    ? values.endDate
      ? `${values.startDate} → ${values.endDate}`
      : `Starts ${values.startDate}`
    : "Schedule pending"; // i18n-exempt: computed label; caller provides t() at presentation

  const usageLabel =
    values.usageLimit > 0
      ? `${values.usageLimit} uses remaining`
      : "Unlimited use"; // i18n-exempt: computed label; caller provides t() at presentation

  return {
    // i18n-exempt: placeholder code for previews
    code: values.code || "NEWCODE",
    label: amountLabel,
    validity,
    appliesTo: values.appliesTo,
    usageLabel,
  };
}
