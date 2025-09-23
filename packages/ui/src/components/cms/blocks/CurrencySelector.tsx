"use client";

import React from "react";
import { useCurrency, type Currency } from "@acme/platform-core/contexts/CurrencyContext";

export interface CurrencySelectorProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function CurrencySelector({ className, ...rest }: CurrencySelectorProps) {
  const [currency, setCurrency] = useCurrency();
  const options: Currency[] = ["EUR", "USD", "GBP"];
  return (
    <div className={className} {...rest}>
      <label className="sr-only" htmlFor="currency-select">Currency</label>
      <select
        id="currency-select"
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

