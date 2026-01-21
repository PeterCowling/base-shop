'use client';


import type { ReactNode } from "react";

import { useTranslations } from "@acme/i18n";

import { getContactRowsForPerson } from "@/data/people";
import { joinClasses } from "@/lib/joinClasses";
import type { Locale } from "@/lib/locales";
import type { Section } from "@/lib/routes";

import Nav from "./Nav";

type PageShellProps = {
  children: ReactNode;
  lang: Locale;
  active: Section;
};

export default function PageShell({ children, lang, active }: PageShellProps) {
  const translator = useTranslations();
  const isZh = lang === "zh";
  const isEn = lang === "en";
  const isIt = lang === "it";
  const usesLoketFooter = isEn || isIt;
  const borderColor = isZh ? "border-accent/40" : "border-border";
  // i18n-exempt -- DS-000 protocol mapping for zh footer contact links [ttl=2026-12-31]
  const footerContactRows = getContactRowsForPerson("cristiana");

  const buildContactHref = (value: string, prefix: string) => {
    if (prefix === "https://") {
      return `${prefix}${value.replace(/^(https?:\/\/)/i, "")}`;
    }
    if (prefix === "tel:") {
      return `${prefix}${value.replace(/\s+/g, "")}`;
    }
    return `${prefix}${value}`;
  };

  return (
    <div className="skylar-shell">
      <Nav lang={lang} active={active} isZh={isZh} />
      <main className="space-y-12">{children}</main>
      <footer className={usesLoketFooter ? "loket-footer" : joinClasses("zh-footer", "border-t", borderColor)}>
        {usesLoketFooter ? (
          <div className="loket-footer__inner">
            <span>{translator("footer.copy")}</span>
            <span>{translator("footer.copyright")}</span>
          </div>
        ) : (
          <>
            <div className="zh-footer__contacts">
              {footerContactRows.map((row) => {
                const value = translator(row.valueKey);
                const href = buildContactHref(value, row.hrefPrefix);
                return (
                  <div key={row.labelKey} className="zh-footer__row">
                    <span>{translator(row.labelKey)}：</span>
                    <a
                      href={href}
                      target={row.hrefPrefix === "https://" ? "_blank" : undefined}
                      rel={row.hrefPrefix === "https://" ? "noreferrer" : undefined}
                    >
                      {value}
                    </a>
                  </div>
                );
              })}
            </div>
            <div className="zh-footer__legal">
              <span>{translator("footer.copy")}</span>
              <span>{translator("footer.copyright")}</span>
            </div>
          </>
        )}
      </footer>
    </div>
  );
}
