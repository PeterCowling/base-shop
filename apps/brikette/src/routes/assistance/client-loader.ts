import type { LoaderFunctionArgs } from "react-router-dom";

import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import enAssistanceSection from "@/locales/en/assistanceSection.json";
import { assistanceSlugSchema } from "@/types/loaderSchemas";
import { langFromRequest } from "@/utils/lang";
import { preloadI18nNamespaces } from "@/utils/loadI18nNs";
import { validateOrThrow } from "@/utils/validate";

const ASSISTANCE_NAMESPACES = [
  "assistanceSection",
  "assistance",
  "assistanceCommon",
  "faq",
  "translation",
  "howToGetHere",
  "experiencesPage",
] as const;

async function loadNamespaces(lang: AppLanguage): Promise<void> {
  await preloadI18nNamespaces(lang, ASSISTANCE_NAMESPACES, { optional: true });
  await preloadI18nNamespaces(lang, ["guides"], { optional: true });
}

function resolveMeta(
  lang: AppLanguage,
  key: "meta.title" | "meta.description"
): string {
  const localized = i18n.getResource(lang, "assistanceSection", key);
  if (typeof localized === "string" && localized.trim()) {
    return localized;
  }

  const english = i18n.getResource("en", "assistanceSection", key);
  if (typeof english === "string" && english.trim()) {
    return english;
  }

  const fallbackMeta = {
    title:
      typeof enAssistanceSection?.meta?.title === "string"
        ? enAssistanceSection.meta.title
        : "",
    description:
      typeof enAssistanceSection?.meta?.description === "string"
        ? enAssistanceSection.meta.description
        : "",
  } as const;

  return key === "meta.title" ? fallbackMeta.title : fallbackMeta.description;
}

function extractSlug(url: URL): string | undefined {
  const [, , , rawSlug] = url.pathname.split("/");
  const maybeSlug = rawSlug?.trim() ? rawSlug : undefined;
  return maybeSlug
    ? validateOrThrow(assistanceSlugSchema, { slug: maybeSlug }, 404).slug
    : undefined;
}

export type AssistanceLoaderData = {
  lang: AppLanguage;
  slug?: string;
  title: string;
  desc: string;
};

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const lang = langFromRequest(request);

  try {
    await loadNamespaces(lang);
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      throw error;
    }
  }

  await i18n.changeLanguage(lang);

  const slug = extractSlug(new URL(request.url));
  return {
    lang,
    title: resolveMeta(lang, "meta.title"),
    desc: resolveMeta(lang, "meta.description"),
    ...(slug !== undefined ? { slug } : {}),
  } satisfies AssistanceLoaderData;
}
