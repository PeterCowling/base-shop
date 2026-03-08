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
  // Double private room has its own separate Octorate endpoint (TASK-12a decision).
  // Path lives under the existing double-room route segment (not localized separately).
  return `/${lang}/private-rooms/double-room/book`;
}
