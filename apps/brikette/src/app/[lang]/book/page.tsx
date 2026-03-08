// src/app/[lang]/book/page.tsx
// Book page - App Router version
import { Suspense } from "react";
import type { Metadata } from "next";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getNamespaceBundles, getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { BOOKING_CODE } from "@/context/modal/constants";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";
import { resolveLabel } from "@/utils/translation-fallback";

import BookPageContent from "./BookPageContent";

type Props = {
  params: Promise<{ lang: string }>;
};

const HOSTEL_NOSCRIPT_OCTORATE_URL = `https://book.octorate.com/octobook/site/reservation/calendar.xhtml?codice=${BOOKING_CODE}` as const;

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["bookPage"], { optional: true });

  const title = (t("meta.title") as string) ?? "";
  const description = (t("meta.description") as string) ?? "";

  const bookSlug = getSlug("book", validLang);
  const path = `/${validLang}/${bookSlug}`;

  const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
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
    isPublished: false,
  });
}

export default async function BookPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["bookPage"], { optional: true });
  const preloadedNamespaceBundles = await getNamespaceBundles(validLang, [
    "bookPage",
    "roomsPage",
    "landingPage",
    "faq",
    "_tokens",
    "modals",
    "footer",
    "testimonials",
    "ratingsBar",
    "dealsPage",
  ]);
  const heading = resolveLabel(t, "heading", "");
  /* eslint-disable ds/no-hardcoded-copy -- TASK-08 [ttl=2026-12-31] i18n-exempt: noscript-only fallback strings, not rendered in normal UI */
  const noscriptMessage = resolveLabel(
    t,
    "noscript.jsDisabledAssistance",
    "Hostel bookings are handled with assisted support when JavaScript is disabled.",
  );
  const noscriptLinkLabel = resolveLabel(
    t,
    "noscript.emailAssistedBooking",
    "Email us for assisted booking",
  );
  const octorateLinkLabel = resolveLabel(
    t,
    "noscript.octorateDirectBooking",
    "Continue to secure booking",
  );
  /* eslint-enable ds/no-hardcoded-copy */

  return (
    <>
      {/* Wrap in Suspense because BookPageContent uses useSearchParams */}
      <Suspense fallback={null}>
        <BookPageContent
          lang={validLang}
          heading={heading}
          preloadedNamespaceBundles={preloadedNamespaceBundles}
        />
      </Suspense>
      {/* No-JS fallback (TASK-10B): direct Octorate link rendered in RSC layer so it
          is always present in server HTML, visible only when JavaScript is disabled. */}
      <noscript>
        <div>
          {noscriptMessage}{" "}
          <a
            href={HOSTEL_NOSCRIPT_OCTORATE_URL}
            rel="nofollow noopener noreferrer"
            target="_blank"
          >
            {octorateLinkLabel}
          </a>
          .{" "}
          <a
            href="mailto:hostelpositano@gmail.com?subject=Hostel%20booking%20assistance"
            rel="nofollow noopener noreferrer"
          >
            {noscriptLinkLabel}
          </a>
          .
        </div>
      </noscript>
    </>
  );
}
