// src/app/[lang]/book/page.tsx
// Book page - App Router version
import { Suspense } from "react";
import type { Metadata } from "next";

import { getTranslations, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";
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

  // Wrap in Suspense because BookPageContent uses useSearchParams
  return (
    <Suspense fallback={null}>
      <BookPageContent lang={validLang} />
    </Suspense>
  );
}
