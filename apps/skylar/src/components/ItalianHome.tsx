'use client';

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "@i18n";
import type { Locale } from "@/lib/locales";
import { localizedPath } from "@/lib/routes";

const INTRO_COLUMNS = ["flywheel", "products", "realEstate"] as const;

const CATEGORY_KEYS = ["materiali", "casa", "ospitalita", "studi"] as const;

const SPREADS = [
  {
    key: "design",
    image: {
      src: "/handbag-insert.webp",
      width: 520,
      height: 420,
      altKey: "home.it.split.design.imageAlt",
    },
    hrefKey: "products",
    reverse: false,
  },
  {
    key: "built",
    image: {
      src: "/dog-harness.webp",
      width: 520,
      height: 420,
      altKey: "home.it.split.built.imageAlt",
    },
    hrefKey: "realEstate",
    reverse: true,
  },
] as const;

const REAL_ESTATE_STATS = ["year", "locations", "status"] as const;
const HERO_HEADING_ID = "milan-hero-word"; // i18n-exempt -- DS-000 structural id [ttl=2026-12-31]

const DOSSIER_CARDS = [
  {
    key: "tower",
    hrefKey: "links.tower",
    isPrimary: true,
    reverse: false,
    layout: "stacked",
    media: [
      { src: "/castle.webp", width: 560, height: 420 },
      { src: "/tower.webp", width: 560, height: 420 },
    ],
  },
  {
    key: "step",
    hrefKey: "links.stepFree",
    isPrimary: false,
    reverse: true,
    layout: "paired",
    media: [
      { src: "/stepfree-listing-1.jpg", width: 560, height: 420 },
      { src: "/stepfree-listing-2.jpg", width: 560, height: 420 },
    ],
  },
] as const;

const REAL_ESTATE_IMAGE_SIZES = [
  "(min-width: 1024px) 28vw", // i18n-exempt -- DS-000 responsive size descriptor [ttl=2026-12-31]
  "(min-width: 768px) 40vw", // i18n-exempt -- DS-000 responsive size descriptor [ttl=2026-12-31]
  "100vw", // i18n-exempt -- DS-000 responsive size descriptor [ttl=2026-12-31]
].join(", ");

type Section = "home" | "products" | "people" | "realEstate";

export function ItalianHome({ lang }: { lang: Locale }) {
  const translator = useTranslations();
  const heroPillars = translator("home.it.hero.filters")
    .split("|")
    .map((filter: string) => filter.trim())
    .filter(Boolean);
  const heroImage = {
    src: "/hostel-landing.webp", // i18n-exempt -- DS-000 hero placeholder asset [ttl=2026-12-31]
    width: 560,
    height: 420,
    alt: translator("home.it.hero.imageAlt"),
  };

  return (
    <div className="milan-home">
      <section className="milan-intro-grid">
        {INTRO_COLUMNS.map((columnKey, index) => (
          <article key={columnKey} className="milan-intro__column">
            <p className="milan-intro__tag">
              {translator(`home.it.intro.${columnKey}.tag`)}
            </p>
            <h2 className="milan-intro__title">
              {translator(`home.it.intro.${columnKey}.title`)}
            </h2>
            <p className="milan-intro__body">
              {translator(`home.it.intro.${columnKey}.body`)}
            </p>
            <span className="milan-intro__index">{String(index + 1).padStart(2, "0")}</span>
          </article>
        ))}
      </section>

      <section className="milan-hero" aria-labelledby={HERO_HEADING_ID}>
        <div className="milan-hero__text">
          <p className="milan-eyebrow">{translator("home.it.hero.eyebrow")}</p>
          <h1 id={HERO_HEADING_ID} className="milan-hero__word">
            {translator("home.it.hero.word")}
          </h1>
          <p className="milan-hero__copy">{translator("home.it.hero.copy")}</p>
          <div className="milan-links">
            <Link href={localizedPath(lang, "products")} className="milan-link primary">
              {translator("home.it.hero.ctaPrimary")}
            </Link>
            <Link href={localizedPath(lang, "realEstate")} className="milan-link">
              {translator("home.it.hero.ctaSecondary")}
            </Link>
          </div>
        </div>
        <div className="milan-hero__aside">
          <div className="milan-hero__visual">
            <div className="milan-photo-tint">
              <Image
                src={heroImage.src}
                alt={heroImage.alt}
                width={heroImage.width}
                height={heroImage.height}
                sizes="(min-width: 768px) 40vw, 90vw" /* i18n-exempt -- DS-000 responsive image sizes [ttl=2026-12-31] */
              />
            </div>
          </div>
          <div className="milan-hero__pillars" role="list">
            {heroPillars.map((filter) => (
              <div key={filter} className="milan-hero__pillar" role="listitem">
                <span className="milan-hero__pillar-dot" aria-hidden="true" />
                <span className="milan-hero__pillar-label">{filter}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="milan-category-grid">
        {CATEGORY_KEYS.map((key, index) => (
          <article
            key={key}
            className={`milan-category-card ${index % 2 === 1 ? "is-alt" : ""}`}
          >
            <p className="milan-category-card__label">
              {translator(`home.it.categories.${key}.label`)}
            </p>
            <p className="milan-category-card__body">
              {translator(`home.it.categories.${key}.body`)}
            </p>
          </article>
        ))}
      </section>

      <section className="milan-split-grid">
        {SPREADS.map((spread) => {
          const href = localizedPath(lang, spread.hrefKey as Section);
          return (
            <article
              key={spread.key}
              className={`milan-split ${spread.reverse ? "milan-split--reverse" : ""}`}
            >
              <div className="milan-split__media">
                <div className="milan-photo-tint">
                  <Image
                    src={spread.image.src}
                    alt={translator(spread.image.altKey)}
                    width={spread.image.width}
                    height={spread.image.height}
                    className="milan-split__image"
                    priority={spread.key === "design"}
                  />
                </div>
              </div>
              <div className="milan-split__copy">
                <p className="milan-split__label">{translator(`home.it.split.${spread.key}.label`)}</p>
                <h3 className="milan-split__title">{translator(`home.it.split.${spread.key}.title`)}</h3>
                <p className="milan-split__body">{translator(`home.it.split.${spread.key}.body`)}</p>
                <Link href={href} className="milan-link">
                  {translator(`home.it.split.${spread.key}.cta`)}
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      <section className="milan-realestate-hero">
        <div className="milan-realestate-hero__content">
          <p className="milan-eyebrow">{translator("home.it.realEstate.eyebrow")}</p>
          <h3 className="milan-realestate-hero__word">{translator("home.it.realEstate.word")}</h3>
          <p className="milan-realestate-hero__copy">{translator("home.it.realEstate.copy")}</p>
        </div>
        <div className="milan-realestate-stats">
          {REAL_ESTATE_STATS.map((stat) => (
            <div key={stat} className="milan-realestate-stat">
              <p className="milan-realestate-stat__label">{translator(`home.it.stats.${stat}`)}</p>
              <p className="milan-realestate-stat__value">{translator(`home.it.stats.${stat}Value`)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="milan-realestate-stories">
        {DOSSIER_CARDS.map((card) => {
          const href = translator(card.hrefKey);
          return (
            <article
              key={card.key}
              className={`milan-split milan-realestate-story ${card.reverse ? "milan-split--reverse" : ""}`}
            >
              <div className="milan-split__copy">
                <p className="milan-split__label">
                  {translator(`home.it.realEstate.cards.${card.key}.label`)}
                </p>
                <h4 className="milan-split__title">
                  {translator(`home.it.realEstate.cards.${card.key}.title`)}
                </h4>
                <p className="milan-split__body">
                  {translator(`home.it.realEstate.cards.${card.key}.body`)}
                </p>
                <div className="milan-dossier-card__fields">
                  {["year", "servizio", "stato"].map((field) => (
                    <div key={`${card.key}-${field}`} className="milan-dossier-card__field">
                      <span>{translator(`home.it.fields.${field}`)}</span>
                      <p>{translator(`home.it.realEstate.cards.${card.key}.${field}`)}</p>
                    </div>
                  ))}
                </div>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className={`milan-dossier-card__cta ${card.isPrimary ? "primary" : ""}`}
                >
                  {translator(`home.it.realEstate.cards.${card.key}.cta`)}
                </a>
              </div>
              <div className="milan-split__media">
                <div
                  className={`milan-realestate-gallery ${
                    card.layout === "paired" ? "is-paired" : "is-stacked"
                  }`}
                >
                  {card.media.map((image, index) => (
                    <div key={`${card.key}-image-${index}`} className="milan-realestate-gallery__frame">
                      <div className="milan-photo-tint">
                        <Image
                          src={image.src}
                          alt={translator("realEstate.it.gallery.imageAlt")}
                          width={image.width}
                          height={image.height}
                          sizes={REAL_ESTATE_IMAGE_SIZES}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
