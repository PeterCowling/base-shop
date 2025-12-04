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
        "w-full border-t border-border bg-background text-foreground",
      ]
        .filter(Boolean)
        .join(" ") || undefined}
      {...rest}
    >
      <div className="mx-auto px-4 py-10 sm:py-12">
        {variant === "simple" && (
          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              {t("footer.simple.copyright", { year: String(new Date().getFullYear()) })}
            </p>
            <a href="/legal" className="inline-flex items-center min-h-10 min-w-10 px-2 text-foreground hover:underline">
              {t("footer.simple.legal")}
            </a>
          </div>
        )}
        {variant === "multiColumn" && (
          <div className="grid grid-cols-1 gap-6 text-sm text-muted-foreground sm:grid-cols-2 sm:gap-8 md:grid-cols-4 md:gap-10">
            <div className="min-w-0 space-y-3">
              <h3 className="font-medium text-foreground break-words">{t("footer.columns.shop")}</h3>
              <ul className="min-w-0 space-y-2 break-words">
                <li>
                  <a href="/collections/new" className="inline-flex items-center min-h-10 min-w-10 px-2 text-foreground hover:underline">
                    {t("footer.shop.new")}
                  </a>
                </li>
                <li>
                  <a href="/collections/best" className="inline-flex items-center min-h-10 min-w-10 px-2 text-foreground hover:underline">
                    {t("footer.shop.best")}
                  </a>
                </li>
                <li>
                  <a href="/collections/sale" className="inline-flex items-center min-h-10 min-w-10 px-2 text-foreground hover:underline">
                    {t("footer.shop.sale")}
                  </a>
                </li>
              </ul>
            </div>
            <div className="min-w-0 space-y-3">
              <h3 className="font-medium text-foreground break-words">{t("footer.columns.support")}</h3>
              <ul className="min-w-0 space-y-2 break-words">
                <li>
                  <a href="/help/shipping" className="inline-flex items-center min-h-10 min-w-10 px-2 text-foreground hover:underline">
                    {t("footer.support.shipping")}
                  </a>
                </li>
                <li>
                  <a href="/help/returns" className="inline-flex items-center min-h-10 min-w-10 px-2 text-foreground hover:underline">
                    {t("footer.support.returns")}
                  </a>
                </li>
                <li>
                  <a href="/contact" className="inline-flex items-center min-h-10 min-w-10 px-2 text-foreground hover:underline">
                    {t("footer.support.contact")}
                  </a>
                </li>
              </ul>
            </div>
            <div className="min-w-0 space-y-3">
              <h3 className="font-medium text-foreground break-words">{t("footer.columns.company")}</h3>
              <ul className="min-w-0 space-y-2 break-words">
                <li>
                  <a href="/about" className="inline-flex items-center min-h-10 min-w-10 px-2 text-foreground hover:underline">
                    {t("footer.company.about")}
                  </a>
                </li>
                <li>
                  <a href="/careers" className="inline-flex items-center min-h-10 min-w-10 px-2 text-foreground hover:underline">
                    {t("footer.company.careers")}
                  </a>
                </li>
                <li>
                  <a href="/press" className="inline-flex items-center min-h-10 min-w-10 px-2 text-foreground hover:underline">
                    {t("footer.company.press")}
                  </a>
                </li>
              </ul>
            </div>
            <div className="min-w-0 space-y-3">
              <h3 className="font-medium text-foreground break-words">{t("footer.columns.follow")}</h3>
              <SocialLinks />
            </div>
          </div>
        )}
        {variant === "newsletter" && (
          <div className="w-full">
            <h3 className="mb-2 text-lg font-medium">{t("footer.newsletter.heading")}</h3>
            <p className="mb-4 text-sm text-muted-foreground">{t("footer.newsletter.copy")}</p>
            <NewsletterSignup />
          </div>
        )}
        {variant === "social" && (
          <div className="flex justify-center"><SocialLinks /></div>
        )}
        {variant === "legalHeavy" && (
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              {t("footer.legalHeavy.copyright", { year: String(new Date().getFullYear()) })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("footer.legalHeavy.recaptchaNotice")}
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}
