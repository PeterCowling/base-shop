// src/routes/cookie-policy.redirect.tsx
import { redirect, type LoaderFunctionArgs } from "react-router-dom";
import { i18nConfig, type AppLanguage } from "@/i18n.config";
import { getSlug } from "@/utils/slug";

export async function clientLoader(_args: LoaderFunctionArgs) {
  const lang = i18nConfig.fallbackLng as AppLanguage;
  throw redirect(`/${lang}/${getSlug("cookiePolicy", lang)}`);
}

export default function CookiePolicyRedirect() {
  return null;
}
