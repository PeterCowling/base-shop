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
    imageAlt: translator("products.en.hero.imageAlt"),
    imageSrc: translator("products.en.hero.imageSrc"),
    secondaryImageAlt: translator("products.en.hero.secondaryImageAlt"),
  };
  const heroImageSrc = hero.imageSrc || "/transparent-led.webp";
  const heroImageAlt = hero.imageAlt || hero.secondaryImageAlt;
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
          <div className="products-hero__image-stack">
            <Image
              src={heroImageSrc}
              alt={heroImageAlt}
              width={320}
              height={220}
              className="products-hero__secondary-image"
              priority
            />
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
