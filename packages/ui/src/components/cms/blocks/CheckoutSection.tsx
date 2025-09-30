"use client";

import * as React from "react";
import CheckoutForm from "../../checkout/CheckoutForm";
import type { Locale } from "@acme/i18n/locales";
import { useTranslations } from "@acme/i18n";

export interface CheckoutSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  locale?: Locale;
  taxRegion?: string;
  showWallets?: boolean;
  showBNPL?: boolean;
}

export default function CheckoutSection({ locale = "en" as Locale, taxRegion = "", showWallets = true, showBNPL = true, className, ...rest }: CheckoutSectionProps) {
  const t = useTranslations();
  return (
    // i18n-exempt -- DS-1234 [ttl=2025-11-30] — layout utility string composition for container widths
    <section className={[className, "mx-auto sm:max-w-3xl"].filter(Boolean).join(" ") || undefined} {...rest}>
      <div className="w-full space-y-4">
        {showWallets && (
          <div className="rounded border p-3 text-sm">{t("checkout.wallets.available")}</div>
        )}
        {showBNPL && (
          <div className="rounded border p-3 text-sm">{t("BNPL providers available where supported")}</div>
        )}
        <CheckoutForm locale={locale} taxRegion={taxRegion} />
      </div>
    </section>
  );
}
