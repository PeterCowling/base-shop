"use client";

import {
  type Currency,
  useCurrency,
} from "@acme/platform-core/contexts/CurrencyContext";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../atoms/primitives";

const OPTIONS: Currency[] = ["EUR", "USD", "GBP"];

export default function CurrencySwitcher() {
  const [currency, setCurrency] = useCurrency();

  return (
    <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)}>
      <SelectTrigger className="w-24">
        <SelectValue aria-label={currency}>{currency}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
