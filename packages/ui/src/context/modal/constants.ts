// src/context/modal/constants.ts
/* -------------------------------------------------------------------------- */
/*  Shared constants for modal orchestration                                  */
/* -------------------------------------------------------------------------- */

import hotel from "@ui/config/hotel";
import { i18nConfig, type AppLanguage } from "@ui/i18n.config";

export const BOOKING_CODE = "45111" as const;
export const ENCODED_CONTACT_EMAIL = "aG9zdGVscG9zaXRhbm9AZ21haWwuY29t" as const;
export const HOSTEL_ADDRESS = `${hotel.address.streetAddress}, ${hotel.address.postalCode} ${hotel.address.addressLocality}` as const;

export const LANGUAGE_ORDER: readonly AppLanguage[] = i18nConfig.supportedLngs;

export const CORE_LAYOUT_NAMESPACES = ["header", "footer", "_tokens"] as const;

export const formatDate = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export { i18nConfig };
export type { AppLanguage };
