// src/routes/guides/luggage-storage-positano.service.ts
import { BASE_URL } from "@/config/site";
import i18n from "@/i18n";
import type { TFunction } from "i18next";
import type { GuideSeoTemplateContext } from "./guide-seo/types";
import { resolveLuggageStorageString } from "./luggage-storage-positano.strings";

type ServiceSchemaBase = {
  name: string;
  description: string;
  serviceType?: string;
  areaServed?: string;
  providerName?: string;
  image?: string;
  sameAs?: string[];
  offers?: Array<{
    price: string;
    priceCurrency?: string;
    availability?: string;
    description?: string;
  }>;
  inLanguage?: string;
  url?: string;
};

const SERVICE_DEFAULT_AREA_KEY = "content.luggageStorage.serviceDefaults.areaServed" as const;
const SERVICE_DEFAULT_PROVIDER_KEY = "content.luggageStorage.serviceDefaults.providerName" as const;

type GuidesTranslator = TFunction<"guides">;

function getEnglishGuidesTranslator(): GuidesTranslator {
  try {
    return i18n.getFixedT("en", "guides") as GuidesTranslator;
  } catch {
    return ((key: string, options?: Record<string, unknown>) =>
      typeof options?.defaultValue === "string" ? options.defaultValue : key) as GuidesTranslator;
  }
}

function safeTranslate(key: string, translator?: GuidesTranslator): unknown {
  if (!translator) return undefined;
  try {
    return translator(key);
  } catch {
    return undefined;
  }
}

function normalizeUrl(candidate?: string): string | undefined {
  if (!candidate) return undefined;
  try {
    const parsed = new URL(candidate);
    parsed.hash = "";
    parsed.search = "";
    return parsed.toString();
  } catch {
    if (candidate.startsWith("/")) {
      return `${BASE_URL}${candidate}`;
    }
  }
  return undefined;
}

export function buildGuideServiceSchema(
  context: GuideSeoTemplateContext,
  base: Readonly<ServiceSchemaBase>,
) {
  const guidesTranslator =
    typeof context.translateGuides === "function" ? (context.translateGuides as GuidesTranslator) : undefined;
  const englishGuides = getEnglishGuidesTranslator();

  const englishAreaDefault = englishGuides(SERVICE_DEFAULT_AREA_KEY) as string;
  const englishProviderDefault = englishGuides(SERVICE_DEFAULT_PROVIDER_KEY) as string;

  const resolvedArea =
    resolveLuggageStorageString(
      typeof base.areaServed === "string" && base.areaServed.trim().length > 0
        ? base.areaServed.trim()
        : undefined,
      SERVICE_DEFAULT_AREA_KEY,
      safeTranslate(SERVICE_DEFAULT_AREA_KEY, guidesTranslator),
      englishAreaDefault,
    ) ?? englishAreaDefault;

  const resolvedProvider =
    resolveLuggageStorageString(
      typeof base.providerName === "string" && base.providerName.trim().length > 0
        ? base.providerName.trim()
        : undefined,
      SERVICE_DEFAULT_PROVIDER_KEY,
      safeTranslate(SERVICE_DEFAULT_PROVIDER_KEY, guidesTranslator),
      englishProviderDefault,
    ) ?? englishProviderDefault;

  const resolvedUrl =
    normalizeUrl(context.canonicalUrl) ??
    normalizeUrl(base.url) ??
    `${BASE_URL}/${context.lang}/guides/luggage-storage-positano}`;

  return {
    areaServed: resolvedArea,
    providerName: resolvedProvider,
    url: resolvedUrl,
    inLanguage: context.lang,
  };
}

export default buildGuideServiceSchema;