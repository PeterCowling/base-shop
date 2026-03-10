import type { AppLanguage } from "@/i18n.config";
import type { SlugKey } from "@/types/slugs";

import { getSlug } from "./slug";

export function getLocalizedSectionPath(lang: AppLanguage, key: SlugKey): string {
  return `/${lang}/${getSlug(key, lang)}`;
}

export function getBookPath(lang: AppLanguage): string {
  return getLocalizedSectionPath(lang, "book");
}

export function getPrivateBookingPath(lang: AppLanguage): string {
  return getLocalizedSectionPath(lang, "privateBooking");
}

export function getDoubleRoomBookingPath(lang: AppLanguage): string {
  return getLocalizedSectionPath(lang, "doubleRoomBooking");
}
