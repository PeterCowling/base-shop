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
    // i18n-exempt — layout utility string composition for container widths
    <section className={[className, "mx-auto sm:max-w-3xl"].filter(Boolean).join(" ") || undefined} {...rest}>
      <div className="w-full space-y-4">
        {showWallets && (
          <div className="rounded border p-3 text-sm">{t("Wallets available at payment step (Apple Pay/Google Pay)")}</div>
        )}
        {showBNPL && (
          <div className="rounded border p-3 text-sm">{t("BNPL providers available where supported")}</div>
        )}
        <CheckoutForm locale={locale} taxRegion={taxRegion} />
      </div>
    </section>
  );
}
