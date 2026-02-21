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
  });
}

export default async function BookPage({ params }: Props) {
  const { lang } = await params;
  const validLang = toAppLanguage(lang);

  return (
    <>
      {/* Wrap in Suspense because BookPageContent uses useSearchParams */}
      <Suspense fallback={null}>
        <BookPageContent lang={validLang} />
      </Suspense>
      {/* No-JS fallback (TASK-10B): direct Octorate link rendered in RSC layer so it
          is always present in server HTML, visible only when JavaScript is disabled.
          Satisfies TASK-10A TC-02 gate (no dead-end pre-hydration for /{lang}/book). */}
      <noscript>
        {/* eslint-disable-next-line ds/no-hardcoded-copy -- i18n-exempt: noscript-only technical fallback for no-JS users, not rendered in normal UI. TASK-10B [ttl=2026-12-31] */}
        <a href="https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111">
          Check availability
        </a>
      </noscript>
    </>
  );
}
