"use client";

import React, { useMemo } from "react";
import type { CurrencyCode } from "@/types/product";
import { formatPrice } from "@/lib/pricing";
import { useLocale } from "@/contexts/LocaleContext";
import { toIntlLocale } from "@/lib/locales";

type PriceProps = {
  amount: number;
  currency: CurrencyCode;
};

const Price = React.memo(function Price({ amount, currency }: PriceProps) {
  const locale = useLocale();
  const label = useMemo(() => {
    return formatPrice(amount, currency, toIntlLocale(locale));
  }, [amount, currency, locale]);
  return <span>{label}</span>;
});

export default Price;
