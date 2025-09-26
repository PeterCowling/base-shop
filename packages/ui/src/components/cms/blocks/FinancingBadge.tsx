"use client";

import * as React from "react";

export interface FinancingBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  provider?: "affirm" | "klarna" | "afterpay" | "custom";
  apr?: number; // e.g., 0, 9.99
  termMonths?: number; // e.g., 12
  price?: number; // product price (major units)
  currency?: string; // ISO-4217
  label?: string; // override default label
}

function formatMoney(v: number, currency?: string) {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(v); } catch { return `$${v.toFixed(2)}`; }
}

export default function FinancingBadge({ provider = "custom", apr = 0, termMonths = 12, price, currency, label, className, ...rest }: FinancingBadgeProps) {
  const monthly = React.useMemo(() => {
    if (typeof price !== "number" || price <= 0 || termMonths <= 0) return null;
    // simple non-compounded monthly estimate ignoring APR for display
    const base = price / termMonths;
    return Math.max(0, base);
  }, [price, termMonths]);

  const text = label ?? (monthly != null ? `${formatMoney(monthly, currency)}/mo` : undefined);
  const providerLabel = provider[0].toUpperCase() + provider.slice(1);
  const aprText = apr ? `${apr.toFixed(2)}% APR` : "0% APR";

  return (
    <div className={["inline-flex items-center gap-2 rounded border px-2 py-1 text-xs", className].filter(Boolean).join(" ") || undefined} {...rest}>
      <span className="rounded bg-black px-1.5 py-0.5 text-white">{providerLabel}</span>
      {text ? <span>{text}</span> : null}
      <span className="text-neutral-600">{aprText}</span>
    </div>
  );
}

