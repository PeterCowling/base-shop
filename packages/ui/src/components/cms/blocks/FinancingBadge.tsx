"use client";

import * as React from "react";
import { useTranslations } from "@acme/i18n";

export interface FinancingBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  provider?: "affirm" | "klarna" | "afterpay" | "custom";
  apr?: number; // e.g., 0, 9.99
  termMonths?: number; // e.g., 12
  price?: number; // product price (major units)
  currency?: string; // ISO-4217
  label?: string; // override default label
}

function formatMoney(v: number, currency?: string) {
  try {
    // i18n-exempt -- DS-1234 [ttl=2025-11-30] — currency code fallback is technical, not user copy
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(v);
  } catch {
    // i18n-exempt -- DS-1234 [ttl=2025-11-30] — developer fallback formatting
    return `$${v.toFixed(2)}`;
  }
}

export default function FinancingBadge({ provider = "custom", apr = 0, termMonths = 12, price, currency, label, className, ...rest }: FinancingBadgeProps) {
  const t = useTranslations();
  const monthly = React.useMemo(() => {
    if (typeof price !== "number" || price <= 0 || termMonths <= 0) return null;
    // simple non-compounded monthly estimate ignoring APR for display
    const base = price / termMonths;
    return Math.max(0, base);
  }, [price, termMonths]);

  const text = label ?? (monthly != null ? (t("pricing.perMonthShort", { amount: formatMoney(monthly, currency) }) as string) : undefined);
  const providerLabel = provider[0].toUpperCase() + provider.slice(1);
  const aprText = apr ? (t("finance.apr", { apr: `${apr.toFixed(2)}%` }) as string) : (t("finance.aprZero") as string);

  return (
    <div
      className={[
        // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        "inline-flex items-center gap-2 rounded border px-2 py-1 text-xs",
        className,
      ]
        .filter(Boolean)
        .join(" ") || undefined}
      {...rest}
    >
      <span
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
        className="rounded bg-foreground px-1.5 py-0.5 text-foreground"
      >
        {providerLabel} {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] — provider brand/proper noun */}
      </span>{" "}
      {/* i18n-exempt — provider brand/proper noun */}
      {text ? <span>{text}</span> : null}
      <span
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
        className="text-muted-foreground"
      >
        {aprText}
      </span>
    </div>
  );
}
