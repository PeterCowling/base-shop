"use client";

import React from "react";
import { useTranslations } from "@acme/i18n";
import NewsletterSignup from "./NewsletterSignup";
import SocialLinks from "./SocialLinks";

export interface FooterSectionProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "simple" | "multiColumn" | "legalHeavy" | "newsletter" | "social";
}

export default function FooterSection({ variant = "simple", className, ...rest }: FooterSectionProps) {
  const t = useTranslations();
  return (
    <footer
      className={[
        className,
        // i18n-exempt -- DS-1234 [ttl=2025-11-30]
        "w-full border-t bg-neutral-50",
      ]
        .filter(Boolean)
        .join(" ") || undefined}
      {...rest}
    >
      <div className="mx-auto px-4 py-8">
        {variant === "simple" && (
          <div className="flex items-center justify-between text-sm text-neutral-700">
            <p>
              {t("footer.simple.copyright", { year: String(new Date().getFullYear()) })}
            </p>
            <a href="/legal" className="inline-flex items-center min-h-10 min-w-10 px-2 hover:underline">
              {t("footer.simple.legal")}
            </a>
          </div>
        )}
        {variant === "multiColumn" && (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 text-sm">
            <div>
              <h3 className="mb-2 font-medium">{t("footer.columns.shop")}</h3>
              <ul className="space-y-1 text-neutral-700">
                <li>
                  <a href="/collections/new" className="inline-flex items-center min-h-10 min-w-10 px-2 hover:underline">
                    {t("footer.shop.new")}
                  </a>
                </li>
                <li>
                  <a href="/collections/best" className="inline-flex items-center min-h-10 min-w-10 px-2 hover:underline">
                    {t("footer.shop.best")}
                  </a>
                </li>
                <li>
                  <a href="/collections/sale" className="inline-flex items-center min-h-10 min-w-10 px-2 hover:underline">
                    {t("footer.shop.sale")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium">{t("footer.columns.support")}</h3>
              <ul className="space-y-1 text-neutral-700">
                <li>
                  <a href="/help/shipping" className="inline-flex items-center min-h-10 min-w-10 px-2 hover:underline">
                    {t("footer.support.shipping")}
                  </a>
                </li>
                <li>
                  <a href="/help/returns" className="inline-flex items-center min-h-10 min-w-10 px-2 hover:underline">
                    {t("footer.support.returns")}
                  </a>
                </li>
                <li>
                  <a href="/contact" className="inline-flex items-center min-h-10 min-w-10 px-2 hover:underline">
                    {t("footer.support.contact")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium">{t("footer.columns.company")}</h3>
              <ul className="space-y-1 text-neutral-700">
                <li>
                  <a href="/about" className="inline-flex items-center min-h-10 min-w-10 px-2 hover:underline">
                    {t("footer.company.about")}
                  </a>
                </li>
                <li>
                  <a href="/careers" className="inline-flex items-center min-h-10 min-w-10 px-2 hover:underline">
                    {t("footer.company.careers")}
                  </a>
                </li>
                <li>
                  <a href="/press" className="inline-flex items-center min-h-10 min-w-10 px-2 hover:underline">
                    {t("footer.company.press")}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-medium">{t("footer.columns.follow")}</h3>
              <SocialLinks />
            </div>
          </div>
        )}
        {variant === "newsletter" && (
          <div className="w-full">
            <h3 className="mb-2 text-lg font-medium">{t("footer.newsletter.heading")}</h3>
            <p className="mb-4 text-sm text-neutral-700">{t("footer.newsletter.copy")}</p>
            <NewsletterSignup />
          </div>
        )}
        {variant === "social" && (
          <div className="flex justify-center"><SocialLinks /></div>
        )}
        {variant === "legalHeavy" && (
          <div className="text-sm text-neutral-700">
            <p className="mb-2">
              {t("footer.legalHeavy.copyright", { year: String(new Date().getFullYear()) })}
            </p>
            <p className="text-xs">
              {t("footer.legalHeavy.recaptchaNotice")}
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}
