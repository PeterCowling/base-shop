"use client";

import * as React from "react";
import CheckoutForm from "../../checkout/CheckoutForm";
import type { Locale } from "@acme/i18n/locales";

export interface CheckoutSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  locale?: Locale;
  taxRegion?: string;
  showWallets?: boolean;
  showBNPL?: boolean;
}

export default function CheckoutSection({ locale = "en" as Locale, taxRegion = "", showWallets = true, showBNPL = true, className, ...rest }: CheckoutSectionProps) {
  return (
    <section className={className} {...rest}>
      <div className="mx-auto max-w-3xl space-y-4">
        {showWallets && (
          <div className="rounded border p-3 text-sm">Wallets available at payment step (Apple Pay/Google Pay)</div>
        )}
        {showBNPL && (
          <div className="rounded border p-3 text-sm">BNPL providers available where supported</div>
        )}
        <CheckoutForm locale={locale} taxRegion={taxRegion} />
      </div>
    </section>
  );
}

