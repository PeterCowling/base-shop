import Link from "next/link";
import { Bath, Check, Home, MapPin, Maximize2, Snowflake, Sparkles, Utensils, WashingMachine, Wifi } from "lucide-react";

import { Section } from "@acme/design-system/atoms";
import { Grid } from "@acme/design-system/primitives";
// eslint-disable-next-line no-restricted-imports -- TASK-30: CfHeroImage is not yet exported from design-system/primitives
import { CfHeroImage } from "@acme/ui/atoms/CfHeroImage";
// eslint-disable-next-line no-restricted-imports -- TASK-30: CfImage is not yet exported from design-system/primitives
import { CfImage } from "@acme/ui/atoms/CfImage";

import ApartmentStructuredData from "@/components/seo/ApartmentStructuredData";
import { WHATSAPP_URL } from "@/config/hotel";
import type { AppLanguage } from "@/i18n.config";

import ApartmentPageClientEffects from "./ApartmentPageClientEffects";

const APARTMENT_HERO_IMAGE_SRC = "/img/677397746.jpg";
const GALLERY_IMAGES = [
  "/img/apt3.jpg",
  "/img/677389089.jpg",
  "/img/apt2.jpg",
] as const;
const HIGHLIGHT_IMAGES = [
  "/img/apt1.jpg",
  "/img/interno3.jpg",
  "/img/apt2.jpg",
] as const;
const AMENITIES_IMAGE_SRC = "/img/725818368.jpg";
const AMENITY_ICONS = [Wifi, Utensils, Snowflake, WashingMachine, Bath, Maximize2] as const;
const CHECK_AVAILABILITY_EVENT = "click_check_availability";
const WHATSAPP_EVENT = "click_whatsapp";
const GALLERY_HEADING_ID = "apartment-gallery-heading";
const AMENITIES_HEADING_ID = "amenities-heading";
const DETAILS_HEADING_ID = "details-heading";

type TextPair = {
  label: string;
  text: string;
};

type Slide = {
  alt: string;
  text: string;
  title: string;
};

type Props = {
  amenities: {
    heading: string;
    imageAlt: string;
    items: string[];
  };
  body: string;
  details: {
    ctaLabel: string;
    heading: string;
    items: string[];
  };
  directSavings: {
    eyebrow: string;
    flex: {
      detail: string;
      label: string;
      saving: string;
    };
    heading: string;
    nr: {
      detail: string;
      label: string;
      saving: string;
    };
  };
  fitCheck: {
    heading: string;
    topics: TextPair[];
  };
  gallery: {
    altFallback: string;
    alts: string[];
    captions: string[];
    heading: string;
  };
  hero: {
    ctaLabel: string;
    imageAlt: string;
    intro: string;
    tagline: string;
    title: string;
  };
  highlights: {
    sectionTitle: string;
    slides: Slide[];
  };
  hubCards: {
    privateStay: {
      cta: string;
      href: string;
      subtitle: string;
      title: string;
    };
    streetLevel: {
      cta: string;
      href: string;
      subtitle: string;
      title: string;
    };
  };
  lang: AppLanguage;
  preloadedNamespaceBundles?: unknown;
  primaryCtas: {
    checkAvailabilityLabel: string;
    whatsappLabel: string;
  };
  privateBookingPath: string;
};

function ApartmentHero({
  ctaHref,
  ctaLabel,
  imageAlt,
  intro,
  tagline,
  title,
}: {
  ctaHref: string;
  ctaLabel: string;
  imageAlt: string;
  intro: string;
  tagline: string;
  title: string;
}): JSX.Element {
  return (
    <section className="w-full">
      <div className="relative isolate min-h-96 w-full overflow-hidden sm:min-h-screen lg:min-h-screen">
        <CfHeroImage
          src={APARTMENT_HERO_IMAGE_SRC}
          alt={imageAlt}
          width={1920}
          height={1080}
          quality={85}
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-surface/65 via-surface/35 to-surface/10" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-surface/30 to-transparent" />

        <div className="relative px-6 pb-8 pt-8 sm:w-4/5 sm:pb-12 sm:pt-10 lg:w-2/3 lg:pb-14">
          <div className="space-y-4">
            <span className="block text-xs uppercase tracking-widest text-brand-on-primary/75 sm:text-sm">
              {tagline}
            </span>
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight text-brand-on-primary drop-shadow-lg sm:text-5xl">
              {title}
            </h1>
            <p className="text-base text-brand-on-primary/90 sm:text-lg">{intro}</p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Link
                href={ctaHref}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand-secondary px-9 py-3 text-base font-semibold tracking-wide text-brand-on-accent shadow-lg transition-colors hover:bg-brand-primary hover:text-brand-on-primary"
              >
                {ctaLabel}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HubCards({
  privateStay,
  streetLevel,
}: Props["hubCards"]): JSX.Element {
  const cards = [
    { ...streetLevel, icon: MapPin },
    { ...privateStay, icon: Home },
  ];

  return (
    <Grid cols={1} gap={4} className="sm:grid-cols-2">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border border-brand-outline/30 bg-panel/90 p-5 shadow-sm backdrop-blur transition-shadow hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="mt-0.5 shrink-0 rounded-xl bg-brand-primary/10 p-2.5 text-brand-primary">
                <Icon size={20} aria-hidden />
              </div>
              <div className="flex-1">
                <h2 className="mb-1 text-lg font-semibold text-brand-heading">{card.title}</h2>
                <p className="mb-3 text-sm text-brand-text">{card.subtitle}</p>
                <span className="text-sm font-medium text-brand-primary">{card.cta} {"\u2192"}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </Grid>
  );
}

function FitCheckCard({ fitCheck }: Pick<Props, "fitCheck">): JSX.Element {
  return (
    <div className="rounded-2xl border border-brand-outline/30 bg-brand-surface/50 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-brand-heading">{fitCheck.heading}</h2>
      <dl className="space-y-3">
        {fitCheck.topics.map((topic) => (
          <div key={topic.label} className="flex flex-col gap-0.5">
            <dt className="text-sm font-medium text-brand-primary">{topic.label}</dt>
            <dd className="text-sm text-brand-text">{topic.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function DirectSavingsCard({ directSavings }: Pick<Props, "directSavings">): JSX.Element {
  return (
    <div className="rounded-2xl border border-brand-secondary/50 bg-brand-secondary/10 p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles size={16} className="text-brand-primary" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-widest text-brand-primary">
          {directSavings.eyebrow}
        </span>
      </div>
      <p className="mb-4 text-xl font-bold text-brand-heading">{directSavings.heading}</p>
      <Grid cols={1} gap={3} className="sm:grid-cols-2">
        {[directSavings.nr, directSavings.flex].map((item) => (
          <div key={item.label} className="rounded-xl bg-surface/70 px-4 py-3 dark:bg-black/20">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-brand-heading">{item.label}</span>
              <span className="rounded-full bg-brand-secondary px-2.5 py-0.5 text-sm font-bold text-brand-heading">
                {item.saving}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-brand-text/70">{item.detail}</p>
          </div>
        ))}
      </Grid>
    </div>
  );
}

function PrimaryCtas({
  checkAvailabilityLabel,
  privateBookingPath,
  whatsappLabel,
}: {
  checkAvailabilityLabel: string;
  privateBookingPath: string;
  whatsappLabel: string;
}): JSX.Element {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
      <Link
        href={`${privateBookingPath}/`}
        data-apartment-event={CHECK_AVAILABILITY_EVENT}
        data-apartment-source="hub"
        className="inline-flex w-full min-h-11 items-center justify-center rounded-lg bg-brand-primary px-8 py-3 text-base font-semibold text-brand-on-primary shadow-sm transition-colors hover:bg-brand-primary/90 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-brand-primary focus-visible:focus:ring-offset-2 sm:w-64"
      >
        {checkAvailabilityLabel}
      </Link>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-apartment-event={WHATSAPP_EVENT}
        data-apartment-source="hub"
        className="inline-flex w-full min-h-11 items-center justify-center rounded-lg border border-brand-outline bg-brand-surface px-8 py-3 text-base font-semibold text-brand-primary shadow-sm transition-colors hover:bg-brand-surface/80 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-brand-primary focus-visible:focus:ring-offset-2 sm:w-64"
      >
        {whatsappLabel}
      </a>
    </div>
  );
}

function HighlightsGallery({ highlights }: Pick<Props, "highlights">): JSX.Element {
  return (
    <section className="py-8 lg:py-12">
      <Section as="div" padding="none" className="max-w-6xl px-4">
        <h2 className="mb-8 text-center text-3xl font-extrabold tracking-tight text-brand-heading">
          {highlights.sectionTitle}
        </h2>
        <Grid cols={1} gap={8} className="sm:grid-cols-2 lg:grid-cols-3">
          {highlights.slides.map((slide, index) => (
            <figure
              key={slide.title}
              className="group flex w-full flex-col overflow-hidden rounded-3xl shadow-xl transition-shadow duration-300 hover:shadow-2xl"
            >
              <div className="aspect-video w-full overflow-hidden">
                <CfHeroImage
                  src={HIGHLIGHT_IMAGES[index] ?? HIGHLIGHT_IMAGES[0]}
                  alt={slide.alt}
                  quality={80}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>
              <figcaption className="flex w-full justify-center bg-brand-text/70 px-6 py-6 text-center backdrop-blur-sm dark:bg-brand-bg/70 sm:px-8 sm:py-8">
                <div className="flex w-full flex-col items-center justify-center">
                  <h3 className="text-xl font-semibold leading-snug text-brand-bg dark:text-brand-heading md:text-2xl">
                    {slide.title}
                  </h3>
                  <p className="mt-2 text-sm text-brand-bg/90 dark:text-brand-heading/90 md:text-base">{slide.text}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </Grid>
      </Section>
    </section>
  );
}

function ApartmentGallery({ gallery }: Pick<Props, "gallery">): JSX.Element {
  return (
    <section
      aria-labelledby={
        /* i18n-exempt -- BRIK-APT-SEO [ttl=2026-12-31] Stable DOM id for section labelling. */
        GALLERY_HEADING_ID
      }
      className="space-y-4"
    >
      <h2
        id={
          /* i18n-exempt -- BRIK-APT-SEO [ttl=2026-12-31] Stable DOM id for section labelling. */
          GALLERY_HEADING_ID
        }
        className="text-xl font-semibold text-brand-heading"
      >
        {gallery.heading}
      </h2>
      <Grid cols={1} gap={4} className="sm:grid-cols-3">
        {GALLERY_IMAGES.map((src, index) => (
          <figure key={src} className="flex flex-col gap-2">
            <div className="aspect-4/3 overflow-hidden rounded-md">
              <CfImage
                src={src}
                alt={gallery.alts[index] ?? gallery.altFallback}
                width={640}
                height={480}
                preset="gallery"
                className="h-full w-full object-cover"
              />
            </div>
            {gallery.captions[index] ? (
              <figcaption className="line-clamp-2 text-sm text-brand-text/70">
                {gallery.captions[index]}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </Grid>
    </section>
  );
}

function AmenitiesSection({ amenities }: Pick<Props, "amenities">): JSX.Element {
  return (
    <section
      aria-labelledby={
        /* i18n-exempt -- BRIK-APT-SEO [ttl=2026-12-31] Stable DOM id for section labelling. */
        AMENITIES_HEADING_ID
      }
    >
      <div className="space-y-6">
        <h2
          id={
            /* i18n-exempt -- BRIK-APT-SEO [ttl=2026-12-31] Stable DOM id for section labelling. */
            AMENITIES_HEADING_ID
          }
          className="text-xl font-semibold text-brand-heading"
        >
          {amenities.heading}
        </h2>
        <Grid cols={1} gap={8} className="md:grid-cols-2">
          <div className="overflow-hidden rounded-md">
            <CfImage
              src={AMENITIES_IMAGE_SRC}
              alt={amenities.imageAlt}
              width={800}
              height={600}
              preset="hero"
              className="w-full"
            />
          </div>
          <ul className="space-y-3 text-start">
            {amenities.items.map((item, index) => {
              const Icon = AMENITY_ICONS[index] ?? null;
              return (
                <li key={item} className="flex items-center space-x-3">
                  {Icon ? <Icon size={18} className="shrink-0 text-brand-primary" aria-hidden /> : null}
                  <span>{item}</span>
                </li>
              );
            })}
          </ul>
        </Grid>
      </div>
    </section>
  );
}

function DetailsCard({
  ctaHref,
  details,
}: {
  ctaHref: string;
  details: Props["details"];
}): JSX.Element {
  return (
    <section
      aria-labelledby={
        /* i18n-exempt -- BRIK-APT-SEO [ttl=2026-12-31] Stable DOM id for section labelling. */
        DETAILS_HEADING_ID
      }
      className="flex flex-col items-center space-y-4"
    >
      <h2
        id={
          /* i18n-exempt -- BRIK-APT-SEO [ttl=2026-12-31] Stable DOM id for section labelling. */
          DETAILS_HEADING_ID
        }
        className="text-xl font-semibold text-brand-primary"
      >
        {details.heading}
      </h2>
      <div className="w-full rounded-xl border border-brand-outline/30 bg-brand-surface/50 p-6 text-start shadow-sm">
        <ul className="space-y-2">
          {details.items.map((item) => (
            <li key={item} className="flex items-start space-x-2">
              <Check size={18} className="mt-0.5 text-brand-primary" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4">
          <Link
            href={ctaHref}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-brand-on-primary shadow-sm transition-colors hover:bg-brand-primary/90"
          >
            {details.ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

function ApartmentPageContent({
  amenities,
  body,
  details,
  directSavings,
  fitCheck,
  gallery,
  hero,
  highlights,
  hubCards,
  lang,
  primaryCtas,
  privateBookingPath,
}: Props): JSX.Element {
  return (
    <>
      <ApartmentPageClientEffects lang={lang} />
      <ApartmentStructuredData />

      <Section padding="none" className="mx-auto max-w-6xl p-6 pt-24 sm:pt-10">
        <section className="scroll-mt-24 space-y-16">
          <ApartmentHero
            ctaHref={`${privateBookingPath}/`}
            ctaLabel={hero.ctaLabel}
            imageAlt={hero.imageAlt}
            intro={hero.intro}
            tagline={hero.tagline}
            title={hero.title}
          />

          <Section as="div" padding="none" width="full" className="mx-auto max-w-3xl">
            <p className="text-center text-brand-text md:text-lg">{body}</p>
          </Section>

          <Section as="div" padding="none" width="full" className="mx-auto max-w-3xl">
            <HubCards privateStay={hubCards.privateStay} streetLevel={hubCards.streetLevel} />
          </Section>

          <Section as="div" padding="none" width="full" className="mx-auto max-w-3xl">
            <FitCheckCard fitCheck={fitCheck} />
          </Section>

          <Section as="div" padding="none" width="full" className="mx-auto max-w-3xl">
            <DirectSavingsCard directSavings={directSavings} />
          </Section>

          <Section as="div" padding="none" width="full" className="mx-auto max-w-3xl pt-2">
            <PrimaryCtas
              checkAvailabilityLabel={primaryCtas.checkAvailabilityLabel}
              privateBookingPath={privateBookingPath}
              whatsappLabel={primaryCtas.whatsappLabel}
            />
          </Section>

          <HighlightsGallery highlights={highlights} />
          <ApartmentGallery gallery={gallery} />

          <div className="space-y-8">
            <AmenitiesSection amenities={amenities} />
            <DetailsCard ctaHref={`${privateBookingPath}/`} details={details} />
          </div>
        </section>
      </Section>
    </>
  );
}

export default ApartmentPageContent;
