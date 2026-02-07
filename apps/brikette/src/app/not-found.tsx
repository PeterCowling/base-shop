// src/app/not-found.tsx
// Global 404 page (for requests without language prefix)
import { redirect } from "next/navigation";

import { type AppLanguage,i18nConfig } from "@/i18n.config";

export default function GlobalNotFound() {
  const lang = i18nConfig.fallbackLng as AppLanguage;
  // Redirect to the language-prefixed 404 page
  redirect(`/${lang}`);
}
