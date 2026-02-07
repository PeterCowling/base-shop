// src/context/modal/constants.ts
/* -------------------------------------------------------------------------- */
/*  Shared constants for modal orchestration                                  */
/* -------------------------------------------------------------------------- */

import hotel from "@/config/hotel";
import { type AppLanguage,i18nConfig } from "@/i18n.config";

export { CORE_LAYOUT_I18N_NAMESPACES as CORE_LAYOUT_NAMESPACES } from "@/i18n.namespaces";

export const BOOKING_CODE = "45111" as const;
export const ENCODED_CONTACT_EMAIL = "aG9zdGVscG9zaXRhbm9AZ21haWwuY29t" as const;
export const HOSTEL_ADDRESS = `${hotel.address.streetAddress}, ${hotel.address.postalCode} ${hotel.address.addressLocality}` as const;

export const LANGUAGE_ORDER = Object.freeze([...i18nConfig.supportedLngs]);

export const formatDate = (date: Date): string => {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
};

export { i18nConfig };
export type { AppLanguage };
