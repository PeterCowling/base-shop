// src/routes/assistance/_ArticleFactory/makeArticleLinks.ts
import type { LinksFunction, LinkDescriptor } from "react-router";
import { getSlug } from "@/utils/slug";
import { articleSlug, type HelpArticleKey } from "@/routes.assistance-helpers";
import { i18nConfig } from "@/i18n.config";
import type { AppLanguage } from "@/i18n.config";
import { DOMAIN } from "@/config";
import { normaliseBrowserOrigin } from "@/utils/origin";

export function makeArticleLinks(namespace: string): LinksFunction {
  return (({ data, location }: { data?: unknown; location?: { pathname?: string } }) => {
    const d = (data || {}) as { lang?: AppLanguage };
    const lang = d.lang || (i18nConfig.fallbackLng as AppLanguage);
    const origin = (() => {
      if (typeof window !== "undefined") {
        try {
          const raw = window?.location?.origin ?? "";
          if (raw) return normaliseBrowserOrigin(raw);
        } catch {
          /* ignore missing window */
        }
      }
      return DOMAIN;
    })();
    const fallbackPath = `/${lang}/${getSlug("assistance", lang)}/${articleSlug(lang, namespace as HelpArticleKey)}`;
    const canonicalPath =
      typeof location?.pathname === "string" && location.pathname.startsWith("/") ? location.pathname : fallbackPath;
    const canonical = `${origin}${canonicalPath}`;
    const items: LinkDescriptor[] = [] as unknown as LinkDescriptor[];
    items.push({ rel: "canonical", href: canonical } as unknown as LinkDescriptor);
    i18nConfig.supportedLngs.forEach((l) =>
      items.push({
        rel: "alternate",
        hrefLang: l,
        href: `${origin}/${l}/${getSlug("assistance", l as AppLanguage)}/${articleSlug(l as AppLanguage, namespace as HelpArticleKey)}`,
      } as unknown as LinkDescriptor),
    );
    const fallbackLang =
      ((Array.isArray(i18nConfig.fallbackLng) ? i18nConfig.fallbackLng[0] : i18nConfig.fallbackLng) ??
        i18nConfig.supportedLngs[0]) as AppLanguage;
    const defaultPath = `/${fallbackLang}/${getSlug("assistance", fallbackLang)}/${articleSlug(
      fallbackLang,
      namespace as HelpArticleKey,
    )}`;
    items.push({
      rel: "alternate",
      hrefLang: "x-default",
      href: `${origin}${defaultPath}`,
    } as unknown as LinkDescriptor);
    return items;
  }) as unknown as LinksFunction;
}
