import type { LoaderFunctionArgs } from "react-router-dom";

import { isSupportedLanguage } from "@/config";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { guideNamespace, guideSlug, resolveGuideKeyFromSlug } from "@/guides/slugs";
import { redirect } from "@/compat/router-state";

const normalizePathname = (pathname: string): string => {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
};


export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const pathname = normalizePathname(url.pathname);
  const segments = pathname.split("/").filter(Boolean);
  const langSegment = segments[0];
  const slug = segments[segments.length - 1];
  const fallbackLang = i18nConfig.fallbackLng as AppLanguage;
  const lang = isSupportedLanguage(langSegment) ? (langSegment as AppLanguage) : fallbackLang;

  if (!slug) {
    throw new Response("Not Found", { status: 404 });
  }

  const key = resolveGuideKeyFromSlug(slug, lang);

  if (!key) {
    throw new Response("Not Found", { status: 404 });
  }

  const base = guideNamespace(lang, key);
  const target = `/${lang}/${base.baseSlug}/${guideSlug(lang, key)}`;
  const destination = url.search ? `${target}${url.search}` : target;

  return redirect(destination, { status: 308 });
}

export default function LegacyGuideRedirect(): null {
  return null;
}
