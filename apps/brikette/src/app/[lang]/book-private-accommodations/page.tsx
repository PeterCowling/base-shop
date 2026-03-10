import type { Metadata } from "next";

import { Section } from "@acme/design-system/atoms";
import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import PrivateAccomStructuredDataRsc from "@/components/seo/PrivateAccomStructuredDataRsc";
import { OG_IMAGE } from "@/utils/headConstants";
import { getDoubleRoomBookingPath, getLocalizedSectionPath } from "@/utils/localizedRoutes";
import { getPrivateRoomChildPath } from "@/utils/privateRoomPaths";
import { getSlug } from "@/utils/slug";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["bookPage"]);

  const title = t("apartment.meta.title", { defaultValue: "" }) as string;
  const description = t("apartment.meta.description", { defaultValue: "" }) as string;
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
  const t = await getTranslations(validLang, ["bookPage"]);

  const whyDirectTitle = t("apartment.landing.whyDirectTitle", { defaultValue: "" }) as string;
  const whyDirectItems = t("apartment.landing.whyDirectItems", { returnObjects: true }) as string[];
  const exploreDorms = t("apartment.landing.exploreDorms", { defaultValue: "" }) as string;
  const exploreExperiences = t("apartment.landing.exploreExperiences", { defaultValue: "" }) as string;
  const exploreLocation = t("apartment.landing.exploreLocation", { defaultValue: "" }) as string;

  const doubleRoomPath = getDoubleRoomBookingPath(validLang);
  const apartmentPath = getPrivateRoomChildPath(validLang, "apartment");

  return (
    <>
      {/* Server-rendered structured data */}
      <PrivateAccomStructuredDataRsc lang={validLang} slug={getSlug("privateBooking", validLang)} />

      <Section padding="default" className="mx-auto max-w-4xl">
        {/* eslint-disable-next-line ds/no-hardcoded-copy -- i18n-exempt: combined private booking heading, pending full i18n TASK-08 [ttl=2026-12-31] */}
        <h1 className="text-center text-3xl font-bold tracking-tight text-brand-heading sm:text-4xl">
          Book Private Accommodations
        </h1>

        {/* eslint-disable-next-line ds/no-hardcoded-copy -- i18n-exempt: combined private booking intro, pending full i18n TASK-08 [ttl=2026-12-31] */}
        <p className="mx-auto mt-4 text-center text-base leading-relaxed text-brand-text/80" style={{ maxWidth: "44rem" }}>
          We have two private accommodation options at Hostel Brikette, Positano. Choose the room
          that suits your group — both book direct for our best rate with free breakfast included.
        </p>

        {/* Choice cards */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">

          {/* Double Room */}
          <div className="flex flex-col rounded-xl border border-brand-border bg-brand-surface/60 p-6">
            {/* eslint-disable ds/no-hardcoded-copy -- i18n-exempt: double room card, pending full i18n TASK-08 [ttl=2026-12-31] */}
            <h2 className="text-xl font-semibold text-brand-heading">Double Room</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-text/80">
              A private room with one double bed, ensuite bathroom, and a sea-view terrace on the
              third floor. Ideal for couples.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-brand-text">
              {[
                "1 double bed · up to 2 guests",
                "Ensuite bathroom · 3rd floor",
                "Sea-view terrace · A/C · keycard entry",
                "Bed linen and towels provided",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0 text-brand-primary" aria-hidden="true">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <a
                href={doubleRoomPath}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-brand-on-primary hover:bg-brand-primary/90"
              >
                Book the Double Room →
              </a>
            </div>
            {/* eslint-enable ds/no-hardcoded-copy */}
          </div>

          {/* Apartment */}
          <div className="flex flex-col rounded-xl border border-brand-border bg-brand-surface/60 p-6">
            {/* eslint-disable ds/no-hardcoded-copy -- i18n-exempt: apartment card, pending full i18n TASK-08 [ttl=2026-12-31] */}
            <h2 className="text-xl font-semibold text-brand-heading">The Apartment</h2>
            <p className="mt-2 text-sm leading-relaxed text-brand-text/80">
              85 sqm private apartment on the cliff edge with sea-view terrace, full kitchen, and
              two bathrooms. Perfect for couples or small groups.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-brand-text">
              {[
                "Up to 4 guests · 85 sqm",
                "Full kitchen with dining area",
                "2 bathrooms · sea-view terrace",
                "Wi-Fi, A/C, washer & dryer",
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0 text-brand-primary" aria-hidden="true">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <a
                href={apartmentPath}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-semibold text-brand-on-primary hover:bg-brand-primary/90"
              >
                View the Apartment →
              </a>
            </div>
            {/* eslint-enable ds/no-hardcoded-copy */}
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
              className="min-h-11 text-brand-primary underline hover:text-brand-primary/80"
            >
              {exploreDorms}
            </a>
          )}
          {exploreExperiences && (
            <a
              href={getLocalizedSectionPath(validLang, "experiences")}
              className="min-h-11 text-brand-primary underline hover:text-brand-primary/80"
            >
              {exploreExperiences}
            </a>
          )}
          {exploreLocation && (
            <a
              href={getLocalizedSectionPath(validLang, "howToGetHere")}
              className="min-h-11 text-brand-primary underline hover:text-brand-primary/80"
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
