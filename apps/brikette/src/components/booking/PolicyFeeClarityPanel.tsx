// src/components/booking/PolicyFeeClarityPanel.tsx
//
// Deterministic policy/fee panel rendered pre-handoff to the booking engine.
// Uses existing i18n copy in `bookPage.policies.*` to avoid hardcoded strings.

"use client";

import { memo } from "react";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import hotel from "@/config/hotel";
import type { AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

export type PolicyFeeClarityVariant = "hostel" | "apartment";

type Props = {
  lang: AppLanguage;
  variant?: PolicyFeeClarityVariant;
  className?: string;
};

function resolveItemsForVariant(all: string[], variant: PolicyFeeClarityVariant): string[] {
  if (variant === "hostel") return all;

  // Apartment should not inherit hostel-specific items like keycard/linen deposit
  // or reception hours. We intentionally keep the remaining trust-critical items.
  //
  // bookPage.policies.items:
  // 0 city/tourist tax
  // 1 keycard/linen deposit (hostel-specific)
  // 2 security hold/preauth
  // 3 cancellation admin fee
  // 4 reception/no-show line (hostel-specific)
  return all.filter((_, idx) => idx === 0 || idx === 2 || idx === 3);
}

export default memo(function PolicyFeeClarityPanel({
  lang,
  variant = "hostel",
  className,
}: Props): JSX.Element {
  const { t: tBook } = useTranslation("bookPage", { lng: lang });
  const { t: tFooter } = useTranslation("footer", { lng: lang });

  const rawItems = tBook("policies.items", { returnObjects: true }) as unknown;
  const items = Array.isArray(rawItems) ? (rawItems as string[]) : [];
  const resolved = resolveItemsForVariant(items, variant);

  const termsHref = `/${lang}/${getSlug("terms", lang)}`;

  return (
    <div
      className={[
        "rounded-md border border-brand-outline/30 bg-brand-bg p-4 text-sm text-brand-text/80",
        className ?? "",
      ].join(" ")}
      data-testid={`policy-fee-clarity:${variant}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium text-brand-heading">{tBook("policies.title")}</h3>
        <Link
          href={termsHref}
          prefetch={true}
          className="text-xs font-medium text-brand-primary hover:underline"
        >
          {tFooter("terms")}
        </Link>
      </div>

      {resolved.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {resolved.map((item, idx) => (
            <li key={`${variant}:${idx}`}>{item}</li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-xs">{tBook("policies.footer")}</p>

      {hotel.acceptedPayments && hotel.acceptedPayments.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-brand-outline/20 pt-3">
          <span className="flex items-center gap-1 text-xs font-medium text-brand-heading">
            <ShieldCheck size={14} className="text-brand-primary" aria-hidden="true" />
            {tBook("policies.paymentsLabel")}
          </span>
          {hotel.acceptedPayments.map((method) => (
            <span
              key={method}
              className="rounded-sm border border-brand-outline/30 bg-brand-surface px-2 py-0.5 text-xs text-brand-text/70"
            >
              {method}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});
