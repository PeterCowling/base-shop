"use client";

import React, { useMemo } from "react";

import { useLocale } from "@/contexts/LocaleContext";
import { toIntlLocale } from "@/lib/locales";
import { formatPrice } from "@/lib/pricing";
import type { CurrencyCode } from "@/types/product";

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
