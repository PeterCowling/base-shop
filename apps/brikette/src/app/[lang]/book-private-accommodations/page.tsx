import type { Metadata } from "next";

import { Section } from "@acme/design-system/atoms";
import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import PrivateAccomStructuredDataRsc from "@/components/seo/PrivateAccomStructuredDataRsc";
import { BASE_URL } from "@/config/site";
import { OG_IMAGE } from "@/utils/headConstants";
import { getDoubleRoomBookingPath, getLocalizedSectionPath } from "@/utils/localizedRoutes";
import { getPrivateRoomChildPath } from "@/utils/privateRoomPaths";

type Props = {
  params: Promise<{ lang: string }>;
};

function pickFirstNonEmpty(...values: string[]): string {
  return values.find((value) => value.trim().length > 0) ?? "";
}

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const tBook = await getTranslations(validLang, ["bookPage"]);
  const tHeader = await getTranslations(validLang, ["header"]);
  const tApartment = await getTranslations(validLang, ["apartmentPage"]);
  const tRooms = await getTranslations(validLang, ["roomsPage"]);

  const pageTitle = pickFirstNonEmpty(
    tHeader("navigation.apartment.bookPrivate", { defaultValue: "" }) as string,
    tHeader("apartment", { defaultValue: "" }) as string,
    tBook("apartment.heading", { defaultValue: "" }) as string,
  );
  const brandTitle = (tHeader("title", { defaultValue: "" }) as string) || "";
  const doubleRoomIntro = (tRooms("rooms.double_room.bed_intro", { defaultValue: "" }) as string) || "";
  const apartmentBody = (tApartment("body", { defaultValue: "" }) as string) || "";
  const fallbackDescription = [doubleRoomIntro, apartmentBody].filter(Boolean).join(" ");

  const title = [pageTitle, brandTitle].filter(Boolean).join(" | ");
  const description = fallbackDescription;
  const path = getLocalizedSectionPath(validLang, "privateBooking");

  const image = buildCfImageUrl("/img/apt1.jpg", {
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
    isPublished: true,
  });
}

export default async function BookPrivateAccomodationsPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const tBook = await getTranslations(validLang, ["bookPage"]);
  const tHeader = await getTranslations(validLang, ["header"]);
  const tApartment = await getTranslations(validLang, ["apartmentPage"]);
  const tRooms = await getTranslations(validLang, ["roomsPage"]);

  const pageTitle = pickFirstNonEmpty(
    tHeader("navigation.apartment.bookPrivate", { defaultValue: "" }) as string,
    tHeader("apartment", { defaultValue: "" }) as string,
    tBook("apartment.heading", { defaultValue: "" }) as string,
  );
  const whyDirectTitle = tBook("apartment.landing.whyDirectTitle", { defaultValue: "" }) as string;
  const whyDirectItems = tBook("apartment.landing.whyDirectItems", { returnObjects: true }) as string[];
  const exploreDorms = tBook("apartment.landing.exploreDorms", { defaultValue: "" }) as string;
  const exploreExperiences = tBook("apartment.landing.exploreExperiences", { defaultValue: "" }) as string;
  const exploreLocation = tBook("apartment.landing.exploreLocation", { defaultValue: "" }) as string;

  const doubleRoomTitle = (tRooms("rooms.double_room.title", { defaultValue: "" }) as string) || "";
  const doubleRoomDescription =
    (tRooms("rooms.double_room.bed_description", { defaultValue: "" }) as string) || "";
  const doubleRoomFacilityKeys = tRooms("rooms.double_room.facilities", {
    returnObjects: true,
    defaultValue: [],
  }) as string[];
  const doubleRoomFeatures = (Array.isArray(doubleRoomFacilityKeys) ? doubleRoomFacilityKeys : [])
    .slice(0, 4)
    .map((facilityKey) => tRooms(`facilities.${facilityKey}`, { defaultValue: facilityKey }) as string);

  const apartmentTitle = (tApartment("title", { defaultValue: "" }) as string) || "";
  const apartmentDescription = (tApartment("body", { defaultValue: "" }) as string) || "";
  const apartmentFeatures = (
    tApartment("detailsList", { returnObjects: true, defaultValue: [] }) as string[]
  ).slice(0, 4);

  const pageOptionsSummary = [doubleRoomTitle, apartmentTitle].filter(Boolean).join(" · ");

  const doubleRoomPath = getDoubleRoomBookingPath(validLang);
  const apartmentPath = getPrivateRoomChildPath(validLang, "apartment");
  const pageUrl = `${BASE_URL}${getLocalizedSectionPath(validLang, "privateBooking")}`;

  return (
    <>
      {/* Server-rendered structured data */}
      <PrivateAccomStructuredDataRsc
        lang={validLang}
        pageTitle={pageTitle}
        pageUrl={pageUrl}
        options={[
          { name: doubleRoomTitle, url: `${BASE_URL}${doubleRoomPath}` },
          { name: apartmentTitle, url: `${BASE_URL}${apartmentPath}` },
        ]}
      />

      <Section padding="default" className="mx-auto max-w-4xl">
        <h1 className="text-center text-3xl font-bold tracking-tight text-brand-heading sm:text-4xl">
          {pageTitle}
        </h1>
        {pageOptionsSummary ? (
          <p
            className="mx-auto mt-4 text-center text-base leading-relaxed text-brand-text/80"
            style={{ maxWidth: "44rem" }}
          >
            {pageOptionsSummary}
          </p>
        ) : null}

        {/* Choice cards */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">

          {/* Double Room */}
          <div className="flex flex-col rounded-xl border border-brand-border bg-brand-surface/60 p-6">
            <h2 className="text-xl font-semibold text-brand-heading">{doubleRoomTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-text/80">{doubleRoomDescription}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-brand-text">
              {doubleRoomFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0 text-brand-primary" aria-hidden="true">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <a
                href={doubleRoomPath}
                className="inline-flex min-h-11 min-w-11 w-full items-center justify-center rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-brand-on-primary hover:bg-brand-primary/90"
              >
                {doubleRoomTitle} →
              </a>
            </div>
          </div>

          {/* Apartment */}
          <div className="flex flex-col rounded-xl border border-brand-border bg-brand-surface/60 p-6">
            <h2 className="text-xl font-semibold text-brand-heading">{apartmentTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-text/80">{apartmentDescription}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-brand-text">
              {apartmentFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0 text-brand-primary" aria-hidden="true">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <a
                href={apartmentPath}
                className="inline-flex min-h-11 min-w-11 w-full items-center justify-center rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-brand-on-primary hover:bg-brand-primary/90"
              >
                {apartmentTitle} →
              </a>
            </div>
          </div>
        </div>

        {/* Why book direct */}
        {whyDirectTitle && Array.isArray(whyDirectItems) && whyDirectItems.length > 0 && (
          <div className="mx-auto mt-8 rounded-lg bg-brand-surface/50 p-6" style={{ maxWidth: "44rem" }}>
            <h2 className="text-lg font-semibold text-brand-heading">{whyDirectTitle}</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-brand-text">
              {whyDirectItems.map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0 text-brand-primary" aria-hidden="true">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cross-links */}
        <nav
          className="mx-auto mt-8 justify-center gap-4 text-sm"
          style={{ maxWidth: "44rem", display: "flex", flexWrap: "wrap" }}
        >
          {exploreDorms && (
            <a
              href={getLocalizedSectionPath(validLang, "book")}
              className="inline-flex min-h-11 min-w-11 items-center text-brand-primary underline hover:text-brand-primary/80"
            >
              {exploreDorms}
            </a>
          )}
          {exploreExperiences && (
            <a
              href={getLocalizedSectionPath(validLang, "experiences")}
              className="inline-flex min-h-11 min-w-11 items-center text-brand-primary underline hover:text-brand-primary/80"
            >
              {exploreExperiences}
            </a>
          )}
          {exploreLocation && (
            <a
              href={getLocalizedSectionPath(validLang, "howToGetHere")}
              className="inline-flex min-h-11 min-w-11 items-center text-brand-primary underline hover:text-brand-primary/80"
            >
              {exploreLocation}
            </a>
          )}
        </nav>
      </Section>

      <noscript>
        {/* eslint-disable-next-line ds/no-hardcoded-copy -- i18n-exempt: noscript-only technical fallback for no-JS users, not rendered in normal UI. TASK-08 [ttl=2026-12-31] */}
        <a href="https://book.octorate.com/octobook/site/reservation/calendar.xhtml?codice=45111">
          Check availability
        </a>
      </noscript>
    </>
  );
}
