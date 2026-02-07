/* eslint-disable ds/no-hardcoded-copy, ds/min-tap-size -- STYLING-0001 [ttl=2026-12-31] Milan real-estate CTAs and copy rely on CSS tokens; DS tap-size rule misestimates actual button size */

import Image from "next/image";

import PageShell from "@/components/PageShell";
import type { Locale } from "@/lib/locales";

import type { TranslatedImageSource,TranslateFn } from "../utils";

type EnglishRealEstatePageProps = {
  lang: Locale;
  translator: TranslateFn;
  hostelImages: TranslatedImageSource[];
  stepFreeImages: TranslatedImageSource[];
};

type FlagshipCard = {
  key: string;
  tagline: string;
  body: string[];
  bullets: string[];
  href?: string;
};

const splitPipes = (value: string) =>
  value
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

const splitList = (key: string, translator: TranslateFn) => splitPipes(translator(key));
const splitParagraphs = (key: string, translator: TranslateFn) => splitPipes(translator(key));

export default function EnglishRealEstatePage({
  lang,
  translator,
  hostelImages,
  stepFreeImages,
}: EnglishRealEstatePageProps) {
  const [primaryHostelImage] = hostelImages;

  if (!primaryHostelImage) {
    throw new Error("EnglishRealEstatePage requires at least one hostel image.");
  }

  const heroCopy = {
    eyebrow: translator("realEstate.en.hero.eyebrow"),
    title: translator("realEstate.en.hero.title"),
    body: translator("realEstate.en.hero.body"),
  };

  const flagshipCards: FlagshipCard[] = [
    {
      key: "brikette",
      tagline: translator("realEstate.en.flagships.brikette.tagline"),
      body: splitParagraphs("realEstate.en.flagships.brikette.body", translator),
      bullets: splitList("realEstate.en.flagships.brikette.bullets", translator),
      href: translator("links.hostel"),
    },
    {
      key: "stepfree",
      tagline: translator("realEstate.en.flagships.stepfree.tagline"),
      body: splitParagraphs("realEstate.en.flagships.stepfree.body", translator),
      bullets: splitList("realEstate.en.flagships.stepfree.bullets", translator),
      href: translator("links.stepFree"),
    },
    {
      key: "tower",
      tagline: translator("realEstate.en.flagships.tower.tagline"),
      body: splitParagraphs("realEstate.en.flagships.tower.body", translator),
      bullets: splitList("realEstate.en.flagships.tower.bullets", translator),
    },
  ];

  const galleryAlt = translator("realEstate.en.gallery.imageAlt");
  const galleryImages: TranslatedImageSource[] = [
    { src: "/castle.webp", altKey: "realEstate.en.gallery.imageAlt", alt: galleryAlt },
    { src: "/tower.webp", altKey: "realEstate.en.gallery.imageAlt", alt: galleryAlt },
    ...stepFreeImages.slice(1).map((image) => ({
      ...image,
      alt: galleryAlt,
    })),
  ];

  const stackCards = [
    {
      heading: translator("realEstate.en.stack.cards.stack.heading"),
      body: translator("realEstate.en.stack.cards.stack.body"),
    },
    {
      heading: translator("realEstate.en.stack.cards.guests.heading"),
      body: translator("realEstate.en.stack.cards.guests.body"),
    },
    {
      heading: translator("realEstate.en.stack.cards.experiments.heading"),
      body: translator("realEstate.en.stack.cards.experiments.body"),
    },
  ];

  return (
    <PageShell lang={lang} active="realEstate">
      <section className="loket-hero realestate-hero">
        <div className="loket-hero__copy">
          <p className="loket-hero__eyebrow">{heroCopy.eyebrow}</p>
          <h1 className="loket-hero__title">{heroCopy.title}</h1>
          <p className="loket-hero__subtitle">{heroCopy.body}</p>
        </div>
        <div className="realestate-hero__media">
          <Image
            src={primaryHostelImage.src}
            alt={primaryHostelImage.alt}
            width={420}
            height={320}
            className="realestate-hero__image"
            priority
          />
        </div>
      </section>

      <div className="realestate-showcase" aria-labelledby="realestate-showcase-header">
        <p id="realestate-showcase-header" className="realestate-showcase-heading">
          SHOWCASE
        </p>
        <section className="realestate-flagships">
          {flagshipCards.map((card) => (
            <article key={card.key} className="realestate-flagship-card">
              <p className="realestate-flagship-card__tag">{card.tagline}</p>
              <div className="realestate-flagship-card__body">
                {card.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {card.bullets.length > 0 && (
                <ul>
                  {card.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
              {card.href && (
                <a
                  className="realestate-flagship-card__cta inline-flex min-h-10 min-w-10 items-center justify-center"
                  href={card.href}
                  target={card.key === "tower" ? undefined : "_blank"}
                  rel={card.key === "tower" ? undefined : "noreferrer"}
                >
                  Learn more
                </a>
              )}
            </article>
          ))}
        </section>
      </div>

      <section className="realestate-portfolio-gallery" aria-label={translator("realEstate.en.gallery.aria")}>
        {galleryImages.map((image, index) => (
          <Image
            key={`${image.src}-${index}`}
            src={image.src}
            alt={image.alt}
            width={560}
            height={420}
            className="realestate-portfolio-gallery__image"
            sizes="(min-width: 1200px) 20vw, (min-width: 768px) 33vw, 100vw"
          />
        ))}
      </section>

      <section className="realestate-stack-cards">
        {stackCards.map((card, index) => (
          <article key={card.heading} className="realestate-flagship-card is-stack">
            <p className="realestate-flagship-card__tag">{card.heading}</p>
            <p className="realestate-flagship-card__body">{card.body}</p>
            <a
              className="realestate-flagship-card__cta inline-flex min-h-10 min-w-10 items-center justify-center"
              href={index === 2 ? `mailto:${translator("people.peter.contact.email")}` : translator("links.hostel")}
              target={index === 2 ? undefined : "_blank"}
              rel={index === 2 ? undefined : "noreferrer"}
            >
              Learn more
            </a>
          </article>
        ))}
      </section>
    </PageShell>
  );
}

/* eslint-enable ds/no-hardcoded-copy, ds/min-tap-size */
