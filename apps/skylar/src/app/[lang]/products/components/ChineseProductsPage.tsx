/* eslint-disable ds/min-tap-size -- STYLING-0001 [ttl=2026-12-31] Skylar zh-products CTAs use shared pill tokens; DS tap-size rule misestimates actual button size */

import Image from "next/image";

import PageShell from "@/components/PageShell";
import { joinClasses } from "@/lib/joinClasses";
import { localizedPath } from "@/lib/routes";

import type { ProductsPageComponentProps } from "../types";

export function ChineseProductsPage({ lang, translator }: ProductsPageComponentProps) {
  const hero = {
    eyebrow: translator("products.zh.hero.eyebrow"),
    title: translator("products.zh.hero.title"),
    body: translator("products.zh.hero.body"),
    imageAlt: translator("products.zh.hero.imageAlt"),
    imageSrc: translator("products.zh.hero.imageSrc"),
  };

  const catalogCards = [
    {
      key: "electronics",
      icon: "products-en-icon--electronics",
      title: translator("products.zh.catalog.cards.electronics.title"),
      body: translator("products.zh.catalog.cards.electronics.body"),
    },
    {
      key: "home",
      icon: "products-en-icon--home",
      title: translator("products.zh.catalog.cards.home.title"),
      body: translator("products.zh.catalog.cards.home.body"),
    },
    {
      key: "apparel",
      icon: "products-en-icon--apparel",
      title: translator("products.zh.catalog.cards.apparel.title"),
      body: translator("products.zh.catalog.cards.apparel.body"),
    },
    {
      key: "pet",
      icon: "products-en-icon--pet",
      title: translator("products.zh.catalog.cards.pet.title"),
      body: translator("products.zh.catalog.cards.pet.body"),
    },
  ];

  const serviceCards = [
    {
      key: "design",
      title: translator("products.zh.services.design.title"),
      body: translator("products.zh.services.design.body"),
      subtitle: translator("products.zh.services.design.en"),
    },
    {
      key: "distribution",
      title: translator("products.zh.services.distribution.title"),
      body: translator("products.zh.services.distribution.body"),
      subtitle: translator("products.zh.services.distribution.en"),
    },
    {
      key: "platform",
      title: translator("products.zh.services.platform.title"),
      body: translator("products.zh.services.platform.body"),
      subtitle: translator("products.zh.services.platform.en"),
    },
    {
      key: "markets",
      title: translator("products.zh.services.markets.title"),
      body: translator("products.zh.services.markets.body"),
      subtitle: translator("products.zh.services.markets.en"),
    },
  ];

  const cta = {
    heading: translator("products.zh.cta.heading"),
    body: translator("products.zh.cta.body"),
    note: translator("products.zh.cta.note"),
    emailLabel: translator("products.zh.cta.actionEmail"),
    peopleLabel: translator("products.zh.cta.actionPeople"),
  };
  const contactEmailHref = `mailto:${translator("people.cristiana.contact.email")}`;

  return (
    <PageShell lang={lang} active="products">
      <section className="zh-products-hero">
        <div className="zh-products-hero__copy">
          <p className="zh-products-hero__eyebrow">{hero.eyebrow}</p>
          <h1 className="zh-products-hero__title">{hero.title}</h1>
          <p className="zh-products-hero__body">{hero.body}</p>
        </div>
        <div className="zh-products-hero__media">
          <Image
            src={hero.imageSrc}
            alt={hero.imageAlt}
            width={520}
            height={360}
            className="zh-products-hero__image"
            priority
          />
        </div>
      </section>

      <section className="zh-products-services">
        {serviceCards.map((card) => (
          <article key={card.key} className="zh-card">
            <p className="zh-card__eyebrow">{card.title}</p>
            <p className="zh-card__body">{card.body}</p>
            <p className="zh-card__subtitle">{card.subtitle}</p>
          </article>
        ))}
      </section>

      <section className="zh-products-catalog">
        <p className="zh-products-catalog__heading">{translator("products.zh.catalog.heading")}</p>
        <div className="zh-products-catalog__grid">
          {catalogCards.map((card) => (
            <article key={card.key} className="zh-products-catalog-card">
              <span className={joinClasses("products-en-icon", card.icon)} aria-hidden="true" />
              <div className="zh-products-catalog-card__body">
                <p className="zh-products-catalog-card__title">{card.title}</p>
                <p className="zh-products-catalog-card__copy">{card.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="zh-products-cta">
        <div className="zh-products-cta__copy">
          <p className="zh-products-cta__heading">{cta.heading}</p>
          <p className="zh-products-cta__body">{cta.body}</p>
          <p className="zh-products-cta__note">{cta.note}</p>
        </div>
        <div className="zh-products-cta__actions">
          <a href={contactEmailHref} className="skylar-pill primary min-h-10 min-w-10">
            {cta.emailLabel}
          </a>
          <a href={localizedPath(lang, "people")} className="skylar-pill secondary min-h-10 min-w-10">
            {cta.peopleLabel}
          </a>
        </div>
      </section>
    </PageShell>
  );
}

/* eslint-enable ds/min-tap-size */
