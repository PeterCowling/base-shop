 
// src/components/seo/FaqStructuredData.tsx
import { memo } from "react";
import { useTranslation } from "react-i18next";
import type { FallbackLng } from "i18next";

import { buildCanonicalUrl } from "@acme/ui/lib/seo";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { buildFaqJsonLd } from "@/utils/buildFaqJsonLd";
import { type FaqResource,parseFaqResource } from "@/utils/faq";
import { getSlug } from "@/utils/slug";

import FaqJsonLdScript from "./FaqJsonLdScript";

const pickFirstLanguage = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const candidate = pickFirstLanguage(entry);
      if (candidate) {
        return candidate;
      }
    }
  }

  if (value && typeof value === "object") {
    for (const entry of Object.values(value as Record<string, unknown>)) {
      const candidate = pickFirstLanguage(entry);
      if (candidate) {
        return candidate;
      }
    }
  }

  return undefined;
};

const resolveFallbackLanguage = (fallback: FallbackLng | undefined, requestedLanguage: string): string => {
  if (typeof fallback === "function") {
    return resolveFallbackLanguage(fallback(requestedLanguage), requestedLanguage);
  }

  if (fallback && typeof fallback === "object" && !Array.isArray(fallback)) {
    const record = fallback as Record<string, unknown>;
    const direct = pickFirstLanguage(record[requestedLanguage]);
    if (direct) {
      return direct;
    }
  }

  return pickFirstLanguage(fallback) ?? "en";
};

function FaqStructuredData(): JSX.Element {
  const lang = useCurrentLanguage();
  const { i18n } = useTranslation("faq", { lng: lang });
  const pagePath = `/${lang}/${getSlug("assistance", lang)}`;
  const pageUrl = buildCanonicalUrl(BASE_URL, pagePath);
  const fallbackLangOption = i18n?.options?.fallbackLng;
  let fallbackLang: string | undefined;
  if (fallbackLangOption === false) {
    // Respect explicit opt-out of fallbacks
    fallbackLang = undefined;
  } else {
    fallbackLang = resolveFallbackLanguage(fallbackLangOption, lang);
  }

  const getResourceBundle = (lng: string): FaqResource | undefined => {
    if (!i18n) {
      return undefined;
    }

    const namespaceFromData = i18n.getDataByLanguage?.(lng)?.["faq"];
    if (namespaceFromData && typeof namespaceFromData === "object") {
      return namespaceFromData as FaqResource;
    }

    const bundle = i18n.getResourceBundle?.(lng, "faq");
    if (bundle && typeof bundle === "object") {
      return bundle as FaqResource;
    }

    const storeResource = i18n.services?.resourceStore?.data?.[lng]?.["faq"];
    if (storeResource && typeof storeResource === "object") {
      return storeResource as FaqResource;
    }

    return undefined;
  };

  const resource = getResourceBundle(lang);
  const fallbackResource = fallbackLang ? getResourceBundle(fallbackLang) : undefined;

  const items = parseFaqResource(resource, fallbackResource);

  const payload = buildFaqJsonLd(lang, pageUrl, items);
  const data = payload
    ? {
        ...payload,
        "@id": `${pageUrl}#faq`,
        isPartOf: { "@id": `${BASE_URL}#website` },
        mainEntityOfPage: pageUrl,
      }
    : null;

  return <FaqJsonLdScript data={data} />;
}

export default memo(FaqStructuredData);
