/* eslint-disable ds/no-hardcoded-copy, ds/min-tap-size -- STYLING-0001 [ttl=2026-12-31] Milan real-estate CTAs and copy rely on CSS tokens; DS tap-size rule misestimates actual button size */

import Image from "next/image";

import PageShell from "@/components/PageShell";
import { joinClasses } from "@/lib/joinClasses";
import type { Locale } from "@/lib/locales";

import { SECTIONS } from "../constants";
import { type TranslatedImageSource,type TranslateFn } from "../utils";

type DefaultRealEstatePageProps = {
  lang: Locale;
  translator: TranslateFn;
  hostelImages: TranslatedImageSource[];
  stepFreeImages: TranslatedImageSource[];
};

const IT_FIELD_KEYS = ["year", "location", "status"] as const;
const IT_STACK_KEYS = ["comfort", "experimentation"] as const;

export default function DefaultRealEstatePage({
  lang,
  translator,
  hostelImages,
  stepFreeImages,
}: DefaultRealEstatePageProps) {
  const isZh = lang === "zh";
  const isIt = lang === "it";
  const [primaryHostelImage, secondaryHostelImage] = hostelImages;
  const [primaryStepFreeImage] = stepFreeImages;

  if (!primaryHostelImage || !primaryStepFreeImage) {
    throw new Error("DefaultRealEstatePage requires hostel and StepFree imagery to render.");
  }

  const fallbackHostelImage = secondaryHostelImage ?? primaryHostelImage;

  if (isIt) {
    const galleryAlt = translator("realEstate.it.gallery.imageAlt");
    const galleryImages = [
      { src: "/castle.webp", alt: galleryAlt },
      { src: "/tower.webp", alt: galleryAlt },
      ...stepFreeImages.slice(1).map((image) => ({
        src: image.src,
        alt: galleryAlt,
      })),
    ];

    return (
      <PageShell lang={lang} active="realEstate">
        <section className="milan-realestate-page-hero">
          <div className="milan-realestate-hero-card">
            <p className="milan-eyebrow">{translator("realEstate.it.hero.label")}</p>
            <h1 className="milan-realestate-hero__word">{translator("realEstate.it.hero.title")}</h1>
            <p className="milan-realestate-hero__copy">{translator("realEstate.it.hero.body")}</p>
          </div>
          <div className="milan-realestate-legend">
            <div className="milan-realestate-stats">
              {IT_FIELD_KEYS.map((field) => (
                <div key={field} className="milan-realestate-stat">
                  <p className="milan-realestate-stat__label">{translator(`home.it.fields.${field}`)}</p>
                  <p className="milan-realestate-stat__value">{translator(`realEstate.it.hero.${field}`)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="milan-realestate-hero__image">
            <div className="milan-photo-tint">
              <Image
                src={primaryHostelImage.src}
                alt={primaryHostelImage.alt}
                width={720}
                height={520}
                sizes="(min-width: 1024px) 60vw, 100vw"
                priority
              />
            </div>
          </div>
        </section>

        <section className="milan-blueprint">
          <div className="milan-blueprint__media">
            <div className="milan-photo-tint">
              <Image
                src={fallbackHostelImage.src}
                alt={fallbackHostelImage.alt}
                width={580}
                height={420}
                className="milan-blueprint__image"
                priority
              />
            </div>
          </div>
          <div className="milan-blueprint__copy">
            <p className="milan-split__label">{translator("realEstate.it.blueprint.label")}</p>
            <h2 className="milan-blueprint__title">{translator("realEstate.it.blueprint.title")}</h2>
            <p className="milan-blueprint__body">{translator("realEstate.it.blueprint.body")}</p>
            <div className="milan-dossier-card__fields">
              {IT_FIELD_KEYS.map((field) => (
                <div key={`blueprint-${field}`} className="milan-dossier-card__field">
                  <span>{translator(`home.it.fields.${field}`)}</span>
                  <p>{translator(`realEstate.it.blueprint.${field}`)}</p>
                </div>
              ))}
            </div>
            <a
              href={translator("links.hostel")}
              target="_blank"
              rel="noreferrer"
              className="milan-dossier-card__cta primary min-h-10 min-w-10"
            >
              {translator("realEstate.cta")}
            </a>
          </div>
        </section>

        <section className="realestate-portfolio-gallery" aria-label={translator("realEstate.it.gallery.aria")}>
          {galleryImages.map((image, index) => (
            <div key={`${image.src}-${index}`} className="milan-realestate-gallery__item">
              <div className="milan-photo-tint">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={560}
                  height={420}
                  className="realestate-portfolio-gallery__image"
                  sizes="(min-width: 1200px) 20vw, (min-width: 768px) 33vw, 100vw"
                />
              </div>
            </div>
          ))}
        </section>

        <section className="milan-comfort-stack">
          {IT_STACK_KEYS.map((card) => (
            <article
              key={card}
              className={joinClasses("milan-stack-card", card === "experimentation" && "milan-stack-card--highlight")}
            >
              <div>
                <p className="milan-split__label">{translator(`realEstate.it.stack.${card}.label`)}</p>
                <h3 className="milan-stack-card__title">{translator(`realEstate.it.stack.${card}.title`)}</h3>
                <p className="milan-stack-card__body">{translator(`realEstate.it.stack.${card}.body`)}</p>
              </div>
              {card === "experimentation" && (
                <div className="milan-stack-card__media">
                  <div className="milan-photo-tint">
                    <Image
                      src={primaryStepFreeImage.src}
                      alt={primaryStepFreeImage.alt}
                      width={480}
                      height={320}
                    />
                  </div>
                </div>
              )}
              <a
                href={translator(card === "comfort" ? "links.hostel" : "links.stepFree")}
                target="_blank"
                rel="noreferrer"
                className="milan-stack-card__cta milan-link min-h-10 min-w-10"
              >
                {translator(`realEstate.it.stack.${card}.cta`)}
              </a>
            </article>
          ))}
        </section>
      </PageShell>
    );
  }

  const basePanel = ["rounded-3xl", "border", "p-6", "md:p-8"];
  const zhPanel = ["border-accent/50", "bg-panel/60", "text-fg"];
  const enPanel = ["border-border", "bg-panel", "text-fg"];
  const ctaLinkBase = [
    "mt-6",
    "inline-flex",
    "w-full",
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
  const introClass = "font-body text-base leading-6 text-muted-foreground";
  const panelHeading = "font-display text-xl uppercase skylar-subheading-tracking";
  const panelBody = "mt-4 font-body text-base leading-6 text-muted-foreground";
  const basePanelClasses = joinClasses(...basePanel, ...(isZh ? zhPanel : enPanel));

  return (
    <PageShell lang={lang} active="realEstate">
      <section className="space-y-6">
        <p className="font-display text-4xl uppercase skylar-heading-tracking">
          {translator("realEstate.heading")}
        </p>
        <p className={introClass}>{translator("realEstate.intro")}</p>
      </section>
      <section className="grid gap-8 skylar-real-grid">
        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <article key={section.title} className={basePanelClasses}>
              <p className={panelHeading}>{translator(section.title)}</p>
              <p className={panelBody}>{translator(section.body)}</p>
            </article>
          ))}
        </div>
        <div className="space-y-6">
          <div className={joinClasses("skylar-card", ...(isZh ? zhPanel : enPanel))}>
            <Image
              src="/hostel-positano.svg" /* i18n-exempt -- DS-000 asset path [ttl=2026-12-31] */
              alt={translator("realEstate.imageAlt")}
              width={320}
              height={220}
              className="h-auto w-full rounded-2xl"
              priority
            />
            <p
              className="mt-6 font-body text-base leading-6 text-muted-foreground"
            >
              {translator("realEstate.note")}
            </p>
            <a
              href={translator("links.hostel")}
              target="_blank"
              rel="noreferrer"
              className={joinClasses(...ctaLinkBase, ...(isZh ? ctaZh : ctaEn))}
            >
              {translator("realEstate.cta")}
            </a>
          </div>
        </div>
      </section>

      {isZh && (
        <section className="zh-gallery">
          <article className="zh-gallery__card">
            <div className="zh-gallery__image">
              <Image src={primaryHostelImage.src} alt={primaryHostelImage.alt} width={420} height={320} />
            </div>
            <div className="zh-gallery__body">
              <p className="zh-gallery__label">{translator("showcase.hostel.label")}</p>
              <p>{translator("showcase.hostel.body")}</p>
              <a href={translator("links.hostel")} target="_blank" rel="noreferrer">
                {translator("showcase.hostel.cta")}
              </a>
            </div>
          </article>
          <article className="zh-gallery__card">
            <div className="zh-gallery__image">
              <Image src={primaryStepFreeImage.src} alt={primaryStepFreeImage.alt} width={420} height={320} />
            </div>
            <div className="zh-gallery__body">
              <p className="zh-gallery__label">{translator("showcase.step.label")}</p>
              <p>{translator("showcase.step.body")}</p>
              <a href={translator("links.stepFree")} target="_blank" rel="noreferrer">
                {translator("showcase.step.cta")}
              </a>
            </div>
          </article>
        </section>
      )}
    </PageShell>
  );
}

/* eslint-enable ds/no-hardcoded-copy, ds/min-tap-size */
