"use client";

import React from "react";
import { useTranslations } from "@acme/i18n";
import { useCurrency, type Currency } from "@acme/platform-core/contexts/CurrencyContext";

export type CurrencySelectorProps = React.HTMLAttributes<HTMLDivElement>;

export default function CurrencySelector({ className, ...rest }: CurrencySelectorProps) {
  const t = useTranslations();
  const [currency, setCurrency] = useCurrency();
  // i18n-exempt: ISO currency codes are not translatable copy
  const options: Currency[] = ["EUR", "USD", "GBP"];
  const CURRENCY_SELECT_ID = "currency-select"; // i18n-exempt -- DS-1234 [ttl=2025-11-30] — technical id, not user copy
  return (
    <div className={className} {...rest}>
      <label className="sr-only" htmlFor={CURRENCY_SELECT_ID}>{t("currency.label")}</label>
      <select
        id={CURRENCY_SELECT_ID}
        value={currency}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className="rounded border px-2 py-1 text-sm"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
