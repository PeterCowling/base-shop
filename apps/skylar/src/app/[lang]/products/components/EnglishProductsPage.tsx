/* eslint-disable ds/min-tap-size -- STYLING-0001 [ttl=2026-12-31] DS tap-size rule misestimates actual cell size */

import Image from "next/image";

import PageShell from "@/components/PageShell";
import { joinClasses } from "@/lib/joinClasses";

import type { ProductsPageComponentProps } from "../types";
import { translateList } from "../utils";

export function EnglishProductsPage({ lang, translator }: ProductsPageComponentProps) {
  const hero = {
    eyebrow: translator("products.en.hero.eyebrow"),
    title: translator("products.en.hero.title"),
    body: translator("products.en.hero.body"),
  };
  const heroTitleWords = hero.title.split(" ");
  const heroTitleFirstLine = heroTitleWords.slice(0, 2).join(" ");
  const heroTitleSecondLine = heroTitleWords.slice(2).join(" ");

  const [electronicsCategory = "", homeCategory = "", apparelCategory = "", petCategory = ""] = translateList(
    translator,
    "products.en.catalog.items",
  );

  const catalogCategories = [
    {
      key: "electronics",
      title: electronicsCategory,
      copy: translator("products.en.catalog.copy.electronics"),
      icon: "products-en-icon--electronics",
    },
    {
      key: "home",
      title: homeCategory,
      copy: translator("products.en.catalog.copy.home"),
      icon: "products-en-icon--home",
    },
    {
      key: "apparel",
      title: apparelCategory,
      copy: translator("products.en.catalog.copy.apparel"),
      icon: "products-en-icon--apparel",
    },
    {
      key: "pet",
      title: petCategory,
      copy: translator("products.en.catalog.copy.pet"),
      icon: "products-en-icon--pet",
    },
  ];

  const posterHighlights = [
    {
      word: translator("products.en.design.word"),
      heading: translator("products.en.design.heading"),
      body: translator("products.en.design.body"),
      bullets: translateList(translator, "products.en.design.bullets").slice(0, 2),
    },
    {
      word: translator("products.en.sourcing.word"),
      heading: translator("products.en.sourcing.heading"),
      body: translator("products.en.sourcing.body"),
      bullets: translateList(translator, "products.en.sourcing.bullets").slice(0, 2),
    },
    {
      word: translator("products.en.distribution.word"),
      heading: translator("products.en.distribution.heading"),
      body: translator("products.en.distribution.body"),
      bullets: translateList(translator, "products.en.distribution.bullets").slice(0, 2),
    },
  ];

  return (
    <PageShell lang={lang} active="products">
      <section className="loket-hero realestate-hero products-hero">
        <div className="loket-hero__copy">
          <p className="loket-hero__eyebrow">{hero.eyebrow}</p>
          <h1 className="loket-hero__title">
            <span className="products-hero__title-line">{heroTitleFirstLine}</span>
            {heroTitleSecondLine ? (
              <>
                <br />
                {heroTitleSecondLine}
              </>
            ) : null}
          </h1>
          <p className="loket-hero__subtitle">{hero.body}</p>
        </div>
        <div className="realestate-hero__media">
          <div className="loket-visual-grid">
            <div className="loket-visual-cell loket-visual-cell--cable" aria-hidden="true">
              <span className="loket-visual-cell__label">Electronics</span>
              <span className="loket-visual-graphic" />
              <span className="loket-visual__tagline">CABLE</span>
            </div>
            <div className="loket-visual-cell loket-visual-cell--home" aria-hidden="true">
              <span className="loket-visual-cell__label">Home</span>
              <span className="loket-visual-graphic" />
            </div>
            <a
              href={translator("links.caryina")}
              target="_blank"
              rel="noreferrer"
              className="loket-visual-cell loket-visual-cell--bag loket-visual-cell--linked"
              aria-label={translator("products.en.hero.caryinaLabel")}
            >
              <span className="loket-visual-cell__label" aria-hidden="true">Bags</span>
              <span className="loket-visual-graphic loket-visual-graphic--logo">
                <Image
                  src="/caryina-logo-wordmark.png" /* i18n-exempt -- STYLING-0001 image asset path [ttl=2026-12-31] */
                  alt=""
                  width={160}
                  height={50}
                  className="loket-visual-cell__logo"
                />
              </span>
              <span className="loket-visual-cell__domain" aria-hidden="true">caryina.com</span>
            </a>
            <div className="loket-visual-cell loket-visual-cell--pet" aria-hidden="true">
              <span className="loket-visual-cell__label">Pets</span>
              <span className="loket-visual-graphic" />
            </div>
          </div>
        </div>
      </section>

      <section className="products-en-catalog">
        <p className="realestate-showcase-heading">{translator("products.en.catalog.sectionHeading")}</p>
        <div className="products-en-categories is-grid">
          {catalogCategories.map((category) => (
            <article key={category.key} className="products-en-category-card">
              <span className={joinClasses("products-en-icon", category.icon)} aria-hidden="true" />
              <div className="products-en-category-card__body">
                <p className="products-en-category-card__title">{category.title}</p>
                <p className="products-en-category-card__copy">{category.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="products-en-posters">
        <p className="realestate-showcase-heading">{translator("products.en.platforms.sectionHeading")}</p>
        {posterHighlights.map((poster) => (
          <article key={poster.word} className="products-en-poster">
            <p className="products-en-poster__word" aria-hidden="true">
              {poster.word}
            </p>
            <div className="products-en-poster__content">
              <div className="products-en-poster__copy">
                <h2>{poster.heading}</h2>
                <p>{poster.body}</p>
              </div>
              {poster.bullets && (
                <ul className="products-en-poster__bullets">
                  {poster.bullets.map((bullet) => (
                    <li key={bullet}>
                      <span aria-hidden="true">▸</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ))}
      </section>
    </PageShell>
  );
}

/* eslint-enable ds/min-tap-size */
