'use client';

import Image from "next/image";
import Link from "next/link";

import { useTranslations } from "@acme/i18n";

import type { Locale } from "@/lib/locales";
import { localizedPath } from "@/lib/routes";

type Props = {
  lang: Locale;
};

export function SkylarZhHero({ lang }: Props) {
  const translator = useTranslations();
  const serviceLines = translator("home.zh.serviceLines")
    .split("|")
    .map((line: string) => line.trim())
    .filter(Boolean);
  const englishSubtitle = translator("home.zh.hero.subtitleEn");
  const zhBody = translator("hero.copy");

  return (
    <section className="zh-panel zh-panel--hero">
      <div className="zh-panel__identity">
        <div className="zh-panel__identity-brand">
          <Image
            src="/zh-logo.png" /* i18n-exempt -- DS-000 locale-specific asset [ttl=2026-12-31] */
            alt={translator("logo.alt")}
            width={56}
            height={56}
            className="zh-panel__logo"
            priority
          />
          <div>
            <p className="zh-panel__headline">{translator("hero.headline")}</p>
            <p className="zh-panel__company">{translator("hero.companyCn")}</p>
            <p className="zh-panel__since">{translator("hero.since")}</p>
          </div>
        </div>
        <p className="zh-panel__tagline">{translator("hero.subhead")}</p>
        <p className="zh-panel__support">{translator("hero.support")}</p>
        <div className="zh-panel__actions">
          <Link href={localizedPath(lang, "products")} className="zh-panel__link">
            {translator("hero.cta.primary")}
          </Link>
          <Link href={translator("links.hostel")} target="_blank" rel="noreferrer" className="zh-panel__link">
            {translator("realEstate.cta")}
          </Link>
        </div>
      </div>
      <div className="zh-panel__services-card">
        <div className="zh-panel__services">
          {serviceLines.map((line: string) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <p className="zh-panel__subtitle-en">{englishSubtitle}</p>
        <p className="zh-panel__description">{zhBody}</p>
    </div>
    </section>
  );
}
