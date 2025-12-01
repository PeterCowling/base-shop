'use client';

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "@i18n";
import { getContactRowsForPerson } from "@/data/people";
import type { Locale } from "@/lib/locales";
import { localizedPath } from "@/lib/routes";
import { CRISTIANA_WECHAT_QR_IMAGE } from "@/lib/assets";

type CardProps = {
  lang: Locale;
};

const contactRows = getContactRowsForPerson("cristiana");

export function ZhProductsCard({ lang }: CardProps) {
  const translator = useTranslations();
  const bullets = translator("home.zh.products.bullets")
    .split("|")
    .map((line: string) => line.trim())
    .filter(Boolean);

  return (
    <section className="zh-card">
      <p className="zh-card__eyebrow">{translator("home.zh.products.title")}</p>
      <p className="zh-card__body">{translator("home.zh.products.body")}</p>
      <p className="zh-card__subtitle">{translator("home.zh.products.subtitle")}</p>
      <ul className="zh-card__list">
        {bullets.map((line: string) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <Link href={localizedPath(lang, "products")} className="zh-card__cta">
        {translator("home.zh.products.cta")}
      </Link>
    </section>
  );
}

export function ZhRealEstateCard({ lang: _lang }: CardProps) {
  const translator = useTranslations();
  return (
    <section className="zh-card">
      <p className="zh-card__eyebrow">{translator("home.zh.realEstate.title")}</p>
      <p className="zh-card__body">{translator("home.zh.realEstate.body")}</p>
      <Link
        href={translator("links.hostel")}
        target="_blank"
        rel="noreferrer"
        className="zh-card__cta"
      >
        {translator("home.zh.realEstate.cta")}
      </Link>
    </section>
  );
}

export function ZhContactCard({ lang: _lang }: CardProps) {
  const translator = useTranslations();
  return (
    <section className="zh-card">
      <p className="zh-card__eyebrow">{translator("home.zh.contact.title")}</p>
      <p className="zh-card__body">{translator("home.zh.contact.subtitle")}</p>
      <div className="zh-contact__rows">
        {contactRows.map((row) => (
          <div key={row.labelKey} className="zh-contact__row">
            <span>{translator(row.labelKey)}：</span>
            {translator(row.valueKey)}
          </div>
        ))}
      </div>
      <div className="zh-contact__qr">
        <div className="zh-contact__qr-box" aria-hidden="true">
          <span className="sr-only">{translator("home.zh.contact.note")}</span>
          <Image
            src={CRISTIANA_WECHAT_QR_IMAGE}
            alt={translator("people.cristiana.contact.wechatImageAlt")}
            width={120}
            height={120}
          />
        </div>
        <div className="zh-contact__qr-meta">
          <p>{translator("home.zh.contact.note")}</p>
          <p>{translator("people.cristiana.contact.wechatId")}</p>
        </div>
      </div>
      <Link href={`mailto:${translator("people.cristiana.contact.email")}`} className="zh-card__cta">
        {translator("home.zh.contact.cta")}
      </Link>
    </section>
  );
}
