// src/app/[lang]/book-dorm-bed/page.tsx
// Static-export-safe booking route for the renamed public URL.
import { Suspense } from "react";
import type { Metadata } from "next";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { OG_IMAGE } from "@/utils/headConstants";
import { resolveLabel } from "@/utils/translation-fallback";

import BookPageContent from "../book/BookPageContent";

type Props = {
  params: Promise<{ lang: string }>;
};

export async function generateStaticParams() {
  return generateLangParams();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["bookPage"], { optional: true });

  const title = resolveLabel(t, "meta.title", "");
  const description = resolveLabel(t, "meta.description", "");
  const path = `/${validLang}/book-dorm-bed`;

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

export default async function BookDormBedPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);
  const t = await getTranslations(validLang, ["bookPage"], { optional: true });

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
    "Book direct with Octorate",
  );
  /* eslint-enable ds/no-hardcoded-copy */

  return (
    <>
      <Suspense fallback={null}>
        <BookPageContent lang={validLang} heading={heading} />
      </Suspense>
      <noscript>
        <div>
          {noscriptMessage}{" "}
          <a
            href="https://book.octorate.com/octobook/site/reservation/calendar.xhtml?id=5879"
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
