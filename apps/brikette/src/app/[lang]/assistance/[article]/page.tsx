// src/app/[lang]/assistance/[article]/page.tsx
// Assistance article page - App Router version (dynamic route for all articles)
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { resolveI18nMetaForApp, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { ARTICLE_SLUGS } from "@/article-slug-map";
import buildCfImageUrl from "@/lib/buildCfImageUrl";
import { ARTICLE_KEYS, articleSlug, type HelpArticleKey } from "@/routes.assistance-helpers";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";

import AssistanceArticleContent from "./AssistanceArticleContent";

type Props = {
  params: Promise<{ lang: string; article: string }>;
};

// Map article key to its i18n namespace
const ARTICLE_NAMESPACES: Record<HelpArticleKey, string> = {
  ageAccessibility: "ageAccessibility",
  bookingBasics: "bookingBasics",
  changingCancelling: "changingCancelling",
  checkinCheckout: "checkinCheckout",
  defectsDamages: "defectsDamages",
  depositsPayments: "depositsPayments",
  rules: "rules",
  security: "security",
  legal: "legal",
  arrivingByFerry: "arrivingByFerry",
  naplesAirportBus: "naplesAirportBus",
  travelHelp: "travelHelp",
};

// Resolve article slug to key
function resolveArticleKey(slug: string, lang: string): HelpArticleKey | null {
  for (const key of ARTICLE_KEYS) {
    const dict = ARTICLE_SLUGS[key];
    const expectedSlug = dict[lang as keyof typeof dict] ?? dict.en;
    if (expectedSlug === slug) {
      return key;
    }
  }
  return null;
}

export async function generateStaticParams() {
  const langParams = generateLangParams();
  return langParams.flatMap(({ lang }) =>
    ARTICLE_KEYS.map((key) => ({
      lang,
      article: articleSlug(lang as Parameters<typeof articleSlug>[0], key),
    }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, article } = await params;
  const validLang = toAppLanguage(lang);
  const articleKey = resolveArticleKey(article, validLang);

  if (!articleKey) {
    return {};
  }

  const namespace = ARTICLE_NAMESPACES[articleKey];
  const meta = await resolveI18nMetaForApp(validLang, namespace);

  const assistanceSlug = getSlug("assistance", validLang);
  const localizedArticleSlug = articleSlug(validLang, articleKey);
  const path = `/${validLang}/${assistanceSlug}/${localizedArticleSlug}`;
  const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
    width: OG_IMAGE.width,
    height: OG_IMAGE.height,
    quality: 85,
    format: "auto",
  });

  return buildAppMetadata({
    lang: validLang,
    title: meta.title,
    description: meta.description,
    path,
    image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
  });
}

export default async function AssistanceArticlePage({ params }: Props) {
  const { lang, article } = await params;
  const validLang = toAppLanguage(lang);
  const articleKey = resolveArticleKey(article, validLang);

  if (!articleKey) {
    notFound();
  }

  const namespace = ARTICLE_NAMESPACES[articleKey];

  return <AssistanceArticleContent lang={validLang} articleKey={articleKey} namespace={namespace} />;
}
