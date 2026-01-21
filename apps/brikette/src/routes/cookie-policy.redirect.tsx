// src/routes/cookie-policy.redirect.tsx
import { type LoaderFunctionArgs,redirect } from "react-router-dom";

import { type AppLanguage,i18nConfig } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

export async function clientLoader(_args: LoaderFunctionArgs) {
  const lang = i18nConfig.fallbackLng as AppLanguage;
  throw redirect(`/${lang}/${getSlug("cookiePolicy", lang)}`);
}

export default function CookiePolicyRedirect() {
  return null;
}
