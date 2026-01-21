import Image from "next/image";

import PageShell from "@/components/PageShell";
import { Grid } from "@/components/primitives/Grid";
import { joinClasses } from "@/lib/joinClasses";
import { localizedPath } from "@/lib/routes";

import type { ProductsPageComponentProps } from "../types";

/* eslint-disable ds/no-hardcoded-copy -- STYLING-0001: Milan layout relies on CSS class tokens */
const SECTION_KEYS = [
  {
    title: "products.sections.design.title",
    body: "products.sections.design.body",
  },
  {
    title: "products.sections.distribution.title",
    body: "products.sections.distribution.body",
  },
  {
    title: "products.sections.platform.title",
    body: "products.sections.platform.body",
  },
  {
    title: "products.sections.markets.title",
    body: "products.sections.markets.body",
  },
];

const IT_STACK_KEYS = ["design", "operations", "distribution"] as const;
const IT_CATALOG_CARDS = [
  {
    key: "materiali",
    image: { src: "/transparent-led.webp", width: 420, height: 320 },
  },
  {
    key: "domestico",
    image: { src: "/landing-mobile.avif", width: 420, height: 320 },
  },
  {
    key: "ospitalita",
    image: { src: "/handbag-insert.webp", width: 420, height: 320 },
  },
  {
    key: "studio",
    image: { src: "/dog-harness.webp", width: 420, height: 320 },
  },
] as const;
const IT_FIELD_KEYS = ["service", "output", "contact"] as const;

const basePanel = ["rounded-3xl", "border", "p-6", "md:p-8"];
const zhPanel = ["border-accent/50", "bg-zinc-900/60", "text-zinc-100"];
const enPanel = ["border-border", "bg-panel", "text-fg"];
const ctaLinkBase = [
  "inline-flex",
  "items-center",
  "justify-center",
  "rounded-full",
  "border",
  "px-5",
  "py-3",
  "text-xs",
  "font-semibold",
  "uppercase",
  "skylar-button-tracking",
];
const ctaZh = ["border-accent/70", "text-accent"];
const ctaEn = ["border-border", "text-fg"];

export function StandardProductsPage({ lang, translator }: ProductsPageComponentProps) {
  const isZh = lang === "zh";
  const isIt = lang === "it";

  if (isIt) {
    return (
      <PageShell lang={lang} active="products">
        <section className="milan-products-hero">
          <div>
            <p className="milan-eyebrow">{translator("products.it.hero.label")}</p>
            <h1 className="milan-products-hero__word">{translator("products.it.hero.word")}</h1>
            <p className="milan-products-hero__copy">{translator("products.it.hero.copy")}</p>
          </div>
          <div className="milan-products-hero__visual">
            <Image
              src="/handbag-insert.webp"
              alt={translator("products.it.hero.imageAlt")}
              width={420}
              height={320}
            />
          </div>
        </section>

        <section className="milan-products-stack">
          {IT_STACK_KEYS.map((key) => (
            <article key={key} className="milan-products-card">
              <p className="milan-products-card__title">{translator(`products.it.vertical.${key}.title`)}</p>
              <div className="milan-products-card__fields">
                {IT_FIELD_KEYS.map((field) => (
                  <div key={`${key}-${field}`} className="milan-products-field">
                    <span>{translator(`products.it.vertical.labels.${field}`)}</span>
                    <p>{translator(`products.it.vertical.${key}.${field}`)}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>

        <section className="milan-catalog-grid">
          {IT_CATALOG_CARDS.map((card, index) => (
            <article
              key={card.key}
              className={`milan-catalog-card ${index % 2 === 0 ? "is-primary" : ""}`}
            >
              <div className="milan-catalog-card__media">
                <div className="milan-photo-tint">
                  <Image
                    src={card.image.src}
                    alt={translator(`products.it.catalog.${card.key}.imageAlt`)}
                    width={card.image.width}
                    height={card.image.height}
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 40vw, 100vw"
                  />
                </div>
              </div>
              <p className="milan-catalog-card__label">
                {translator(`products.it.catalog.${card.key}.label`)}
              </p>
              <p className="milan-catalog-card__body">
                {translator(`products.it.catalog.${card.key}.body`)}
              </p>
            </article>
          ))}
        </section>
      </PageShell>
    );
  }

  const contactEmailHref = `mailto:${translator("people.cristiana.contact.email")}`;
  const panelHeadingClass = "font-display text-xl uppercase skylar-subheading-tracking";
  const panelBodyClass = `mt-4 font-body text-base leading-6 ${isZh ? "text-zinc-200" : "text-muted-foreground"}`;
  const basePanelClasses = joinClasses(...basePanel, ...(isZh ? zhPanel : enPanel));
  const baseCardClasses = joinClasses(...basePanel, "skylar-card", ...(isZh ? zhPanel : enPanel));

  return (
    <PageShell lang={lang} active="products">
      <section className="space-y-6">
        <p className="font-display text-4xl uppercase skylar-heading-tracking">
          {translator("products.heading")}
        </p>
        <p className={`font-body text-base leading-6 ${isZh ? "text-zinc-200" : "text-muted-foreground"}`}>
          {translator("products.intro")}
        </p>
      </section>
      <Grid cols={1} gap={6} className="md:grid-cols-2">
        {SECTION_KEYS.map((section) => (
          <article key={section.title} className={basePanelClasses}>
            <p className={panelHeadingClass}>{translator(section.title)}</p>
            <p className={panelBodyClass}>{translator(section.body)}</p>
          </article>
        ))}
      </Grid>
      <section>
        <div className={baseCardClasses}>
          <p className="font-display text-2xl uppercase skylar-subheading-tracking">
            {translator("products.cta")}
          </p>
          <p className={`mt-4 font-body text-base leading-6 ${isZh ? "text-zinc-200" : "text-muted-foreground"}`}>
            {translator("hero.copy")}
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href={contactEmailHref}
              className={joinClasses(...ctaLinkBase, ...(isZh ? ctaZh : ctaEn))}
            >
              {translator("people.cristiana.contact.emailLabel")}
            </a>
            <a
              href={localizedPath(lang, "people")}
              className={joinClasses(...ctaLinkBase, ...(isZh ? ctaZh : ctaEn))}
            >
              {translator("nav.people")}
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
