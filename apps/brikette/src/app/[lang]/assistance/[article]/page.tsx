// src/app/[lang]/assistance/[article]/page.tsx
// Assistance article page - App Router version (dynamic route for all articles)
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTranslations,resolveI18nMetaForApp, toAppLanguage } from "@/app/_lib/i18n-server";
import { buildAppMetadata } from "@/app/_lib/metadata";
import { generateLangParams } from "@/app/_lib/static-params";
import { ARTICLE_SLUGS } from "@/article-slug-map";
import { GUIDES_INDEX } from "@/data/guides.index";
import buildCfImageUrl from "@acme/ui/lib/buildCfImageUrl";
import { ARTICLE_KEYS, articleSlug, type HelpArticleKey } from "@/routes.assistance-helpers";
import { guideNamespace,guideSlug, resolveGuideKeyFromSlug } from "@/routes.guides-helpers";
import { OG_IMAGE } from "@/utils/headConstants";
import { getSlug } from "@/utils/slug";

import GuideContent from "../../experiences/[slug]/GuideContent";
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
  return langParams.flatMap(({ lang }) => {
    const articleSlugs = ARTICLE_KEYS.map((key) =>
      articleSlug(lang as Parameters<typeof articleSlug>[0], key),
    );
    const guideSlugs = GUIDES_INDEX.filter((guide) => guide.status === "published")
      .map((guide) => guide.key)
      .filter(
        (key) => guideNamespace(lang as Parameters<typeof guideNamespace>[0], key).baseKey === "assistance",
      )
      .map((key) => guideSlug(lang as Parameters<typeof guideSlug>[0], key))
      .filter((slug) => !articleSlugs.includes(slug));

    const slugs = Array.from(new Set([...articleSlugs, ...guideSlugs]));
    return slugs.map((slug) => ({ lang, article: slug }));
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, article } = await params;
  const validLang = toAppLanguage(lang);
  const articleKey = resolveArticleKey(article, validLang);
  const guideKey = articleKey ? null : resolveGuideKeyFromSlug(article, validLang);
  const guideBase = guideKey ? guideNamespace(validLang, guideKey) : null;

  if (!articleKey) {
    if (!guideKey || guideBase?.baseKey !== "assistance") {
      return {};
    }

    const t = await getTranslations(validLang, ["guides"]);
    const pick = (value: unknown, key: string): string => {
      if (typeof value !== "string") return "";
      const trimmed = value.trim();
      if (!trimmed || trimmed === key) return "";
      return trimmed;
    };

    const title =
      pick(t(`content.${guideKey}.seo.title`), `content.${guideKey}.seo.title`) ||
      pick(t(`meta.title`), "meta.title") ||
      "";
    const description =
      pick(t(`content.${guideKey}.seo.description`), `content.${guideKey}.seo.description`) ||
      pick(t(`meta.description`), "meta.description") ||
      "";

    const localizedSlug = guideSlug(validLang, guideKey);
    const path = `/${validLang}/${guideBase.baseSlug}/${localizedSlug}`;
    const image = buildCfImageUrl("/img/hostel-communal-terrace-lush-view.webp", {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      quality: 85,
      format: "auto",
    });

    const guideMeta = GUIDES_INDEX.find((g) => g.key === guideKey);
    const isPublished = (guideMeta?.status ?? "published") === "published";

    return buildAppMetadata({
      lang: validLang,
      title,
      description,
      path,
      ogType: "article",
      image: { src: image, width: OG_IMAGE.width, height: OG_IMAGE.height },
      isPublished,
    });
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
  const guideKey = articleKey ? null : resolveGuideKeyFromSlug(article, validLang);
  const guideBase = guideKey ? guideNamespace(validLang, guideKey) : null;

  if (!articleKey) {
    if (!guideKey || guideBase?.baseKey !== "assistance") {
      notFound();
    }
    return <GuideContent lang={validLang} guideKey={guideKey} />;
  }

  const namespace = ARTICLE_NAMESPACES[articleKey];

  return <AssistanceArticleContent lang={validLang} articleKey={articleKey} namespace={namespace} />;
}
