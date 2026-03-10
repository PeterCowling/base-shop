// src/app/[lang]/private-rooms/apartment/page.tsx
// Apartment page under private-rooms - App Router version
import type { Metadata } from "next";
import type { TFunction } from "i18next";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";
import { resolveBookingCtaLabel } from "@acme/ui/shared";

import { getMultipleTranslations, getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import type { AppLanguage } from "@/i18n.config";
import { OG_IMAGE } from "@/utils/headConstants";
import { getPrivateBookingPath } from "@/utils/localizedRoutes";
import { getPrivateRoomChildPath } from "@/utils/privateRoomPaths";

import ApartmentPageContent from "../ApartmentPageContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["apartmentPage"]);

  const title = (t("meta.title") as string) || "";
  const description = (t("meta.description") as string) || "";
  const imageAlt = (t("heroImageAlt") as string) || "";

  const path = getPrivateRoomChildPath(validLang, "apartment");

  const image = buildCfImageUrl("/img/facade.avif", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });

  return buildAppMetadata({
    lang: validLang,
    title,
    description,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
    imageAlt,
  });
}

const FIT_CHECK_TOPICS = ["arrival", "inside", "sleeping", "sound", "bestFit"] as const;

function readString(
  t: TFunction,
  key: string,
  defaultValue = "",
): string {
  const value = t(key, { defaultValue }) as string;
  if (typeof value !== "string") return defaultValue;
  const trimmed = value.trim();
  if (!trimmed || trimmed === key) return defaultValue;
  return trimmed;
}

function readStringArray(t: TFunction, key: string): string[] {
  const raw = t(key, { returnObjects: true, defaultValue: [] }) as unknown;
  return Array.isArray(raw) ? raw.filter((item): item is string => typeof item === "string") : [];
}

function buildApartmentPageContentProps(
  lang: AppLanguage,
  tApartment: TFunction,
  tTokens: TFunction,
) {
  const privateBookingPath = getPrivateBookingPath(lang);
  const reserveNowLabel =
    resolveBookingCtaLabel(tTokens as TFunction<"_tokens">, {
      fallback: () => readString(tApartment, "bookButton"),
    }) ?? "Book Now";

  return {
    lang,
    privateBookingPath,
    hero: {
      tagline: readString(tApartment, "heroTagline"),
      title: readString(tApartment, "heroTitle"),
      intro: readString(tApartment, "heroIntro"),
      imageAlt: readString(tApartment, "heroImageAlt"),
      ctaLabel: reserveNowLabel,
    },
    body: readString(tApartment, "body"),
    hubCards: {
      streetLevel: {
        href: `${getPrivateRoomChildPath(lang, "street-level-arrival")}/`,
        title: readString(tApartment, "hub.streetLevelCard.title"),
        subtitle: readString(tApartment, "hub.streetLevelCard.subtitle"),
        cta: readString(tApartment, "hub.streetLevelCard.cta"),
      },
      privateStay: {
        href: `${getPrivateRoomChildPath(lang, "private-stay")}/`,
        title: readString(tApartment, "hub.privateStayCard.title"),
        subtitle: readString(tApartment, "hub.privateStayCard.subtitle"),
        cta: readString(tApartment, "hub.privateStayCard.cta"),
      },
    },
    fitCheck: {
      heading: readString(tApartment, "fitCheck.heading"),
      topics: FIT_CHECK_TOPICS.map((topic) => ({
        label: readString(tApartment, `fitCheck.${topic}.label`),
        text: readString(tApartment, `fitCheck.${topic}.text`),
      })),
    },
    directSavings: {
      eyebrow: readString(tApartment, "directSavings.eyebrow"),
      heading: readString(tApartment, "directSavings.heading"),
      nr: {
        label: readString(tApartment, "directSavings.nr.label"),
        saving: readString(tApartment, "directSavings.nr.saving"),
        detail: readString(tApartment, "directSavings.nr.detail"),
      },
      flex: {
        label: readString(tApartment, "directSavings.flex.label"),
        saving: readString(tApartment, "directSavings.flex.saving"),
        detail: readString(tApartment, "directSavings.flex.detail"),
      },
    },
    primaryCtas: {
      checkAvailabilityLabel: readString(tApartment, "checkAvailability"),
      whatsappLabel: readString(tApartment, "streetLevelArrival.whatsappCta"),
    },
    highlights: {
      sectionTitle: readString(tApartment, "highlights.sectionTitle"),
      slides: [
        {
          title: readString(tApartment, "highlights.slides.0.title"),
          text: readString(tApartment, "highlights.slides.0.text"),
          alt: readString(tApartment, "highlights.slides.0.alt"),
        },
        {
          title: readString(tApartment, "highlights.slides.1.title"),
          text: readString(tApartment, "highlights.slides.1.text"),
          alt: readString(tApartment, "highlights.slides.1.alt"),
        },
        {
          title: readString(tApartment, "highlights.slides.2.title"),
          text: readString(tApartment, "highlights.slides.2.text"),
          alt: readString(tApartment, "highlights.slides.2.alt"),
        },
      ],
    },
    gallery: {
      heading: readString(tApartment, "galleryHeading"),
      altFallback: readString(tApartment, "galleryAlt"),
      alts: readStringArray(tApartment, "galleryAlts"),
      captions: readStringArray(tApartment, "galleryCaptions"),
    },
    amenities: {
      heading: readString(tApartment, "amenitiesHeading"),
      imageAlt: readString(tApartment, "amenitiesImageAlt"),
      items: readStringArray(tApartment, "amenitiesList"),
    },
    details: {
      heading: readString(tApartment, "detailsHeading"),
      items: readStringArray(tApartment, "detailsList"),
      ctaLabel: reserveNowLabel,
    },
  };
}

export default async function ApartmentPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const translations = await getMultipleTranslations(validLang, ["apartmentPage", "_tokens"]);
  const content = buildApartmentPageContentProps(
    validLang,
    translations["apartmentPage"],
    translations["_tokens"],
  );

  return <ApartmentPageContent {...content} />;
}
