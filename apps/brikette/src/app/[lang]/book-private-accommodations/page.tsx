import { Suspense } from "react";
import type { Metadata } from "next";

import { Section } from "@acme/design-system/atoms";
import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import PrivateAccomStructuredDataRsc from "@/components/seo/PrivateAccomStructuredDataRsc";
import { OG_IMAGE } from "@/utils/headConstants";

import BookPageContent from "../book/BookPageContent";

type Props = {
  params: Promise<{ lang: string }>;
};

const PRIVATE_BOOKING_SLUG = "book-private-accommodations";

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["bookPage"]);

  const title = t("apartment.meta.title", { defaultValue: "" }) as string;
  const description = t("apartment.meta.description", { defaultValue: "" }) as string;
  const path = `/${validLang}/${PRIVATE_BOOKING_SLUG}`;

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

  const heading = t("apartment.heading", { defaultValue: "" }) as string;
  const intro = t("apartment.landing.intro", { defaultValue: "" }) as string;
  const features = t("apartment.landing.features", { returnObjects: true }) as string[];
  const whyDirectTitle = t("apartment.landing.whyDirectTitle", { defaultValue: "" }) as string;
  const whyDirectItems = t("apartment.landing.whyDirectItems", { returnObjects: true }) as string[];
  const exploreDorms = t("apartment.landing.exploreDorms", { defaultValue: "" }) as string;
  const exploreExperiences = t("apartment.landing.exploreExperiences", { defaultValue: "" }) as string;
  const exploreLocation = t("apartment.landing.exploreLocation", { defaultValue: "" }) as string;

  return (
    <>
      {/* Server-rendered structured data (TASK-03) */}
      <PrivateAccomStructuredDataRsc lang={validLang} slug={PRIVATE_BOOKING_SLUG} />

      {/* Server-rendered landing content (TASK-02) — visible to crawlers */}
      <Section padding="default" className="mx-auto max-w-4xl">
        <h1 className="text-center text-3xl font-bold tracking-tight text-brand-heading sm:text-4xl">
          {heading}
        </h1>

        {intro && (
          <p className="mx-auto mt-4 text-center text-base leading-relaxed text-brand-text/80" style={{ maxWidth: "42rem" }}>
            {intro}
          </p>
        )}

        {/* Feature highlights */}
        {Array.isArray(features) && features.length > 0 && (
          <ul className="mx-auto mt-6 columns-2 gap-x-6 text-sm text-brand-text sm:columns-3" style={{ maxWidth: "42rem" }}>
            {features.map((feature) => (
              <li key={feature} className="mb-2 break-inside-avoid items-start gap-1.5" style={{ display: "flex" }}>
                <span className="mt-0.5 text-brand-primary" aria-hidden="true">{"\u2713"}</span>
                {feature}
              </li>
            ))}
          </ul>
        )}

        {/* Why book direct */}
        {whyDirectTitle && Array.isArray(whyDirectItems) && whyDirectItems.length > 0 && (
          <div className="mx-auto mt-8 rounded-lg bg-brand-surface/50 p-6" style={{ maxWidth: "42rem" }}>
            <h2 className="text-lg font-semibold text-brand-heading">{whyDirectTitle}</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-brand-text">
              {whyDirectItems.map((item) => (
                <li key={item} className="flex items-start gap-1.5">
                  <span className="mt-0.5 text-brand-primary" aria-hidden="true">{"\u2713"}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cross-links */}
        <nav
          className="mx-auto mt-8 justify-center gap-4 text-sm"
          style={{ maxWidth: "42rem", display: "flex", flexWrap: "wrap" }}
        >
          {exploreDorms && (
            <a href={`/${validLang}/book-dorm-bed`} className="text-brand-primary underline hover:text-brand-primary/80">
              {exploreDorms}
            </a>
          )}
          {exploreExperiences && (
            <a href={`/${validLang}/experiences`} className="text-brand-primary underline hover:text-brand-primary/80">
              {exploreExperiences}
            </a>
          )}
          {exploreLocation && (
            <a href={`/${validLang}/how-to-get-here`} className="text-brand-primary underline hover:text-brand-primary/80">
              {exploreLocation}
            </a>
          )}
        </nav>
      </Section>

      {/* Client-rendered booking widget — pass empty heading to suppress duplicate H1 */}
      <Suspense fallback={null}>
        <BookPageContent
          lang={validLang}
          heading=""
          includedRoomIds={["double_room", "apartment"]}
        />
      </Suspense>
      <noscript>
        {/* eslint-disable-next-line ds/no-hardcoded-copy -- i18n-exempt: noscript-only technical fallback for no-JS users, not rendered in normal UI. TASK-08 [ttl=2026-12-31] */}
        <a href="https://book.octorate.com/octobook/site/reservation/calendar.xhtml?codice=45111">
          Check availability
        </a>
      </noscript>
    </>
  );
}
