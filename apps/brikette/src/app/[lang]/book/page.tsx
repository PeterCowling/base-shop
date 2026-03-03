// src/app/[lang]/book/page.tsx
// Book page - App Router version
import { Suspense } from "react";
import type { Metadata } from "next";

import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";

import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";

import BookPageContent from "./BookPageContent";

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
  const heading = (t("heading") as string) || "";
  const noscriptMessage = (t("noscript.jsDisabledAssistance") as string) || "";
  const noscriptLinkLabel = (t("noscript.emailAssistedBooking") as string) || "";

  return (
    <>
      {/* Wrap in Suspense because BookPageContent uses useSearchParams */}
      <Suspense fallback={null}>
        <BookPageContent lang={validLang} heading={heading} />
      </Suspense>
      {/* No-JS fallback (TASK-10B): direct Octorate link rendered in RSC layer so it
          is always present in server HTML, visible only when JavaScript is disabled. */}
      <noscript>
        <div>
          {noscriptMessage}{" "}
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
