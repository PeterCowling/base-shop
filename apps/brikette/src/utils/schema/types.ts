// src/utils/schema/types.ts
// -----------------------------------------------------------------------------
// Constants and local types for JSON-LD builders.
// -----------------------------------------------------------------------------

import { BASE_URL } from "@/config/site";
import type { Hotel } from "@/types/schema";

export const WEBSITE_ID = `${BASE_URL}/#website`;
export const ORG_ID = `${BASE_URL}/#org`;
export const HOTEL_ID = `${BASE_URL}/#hotel`;

// Narrowed extension of Hotel node for internal assembly
export type ExtHotelNode = Hotel & {
  mainEntityOfPage?: string;
  publisher?: { "@type": "Organization"; name: string; url: string };
  inLanguage?: string;
  isPartOf?: { "@id": string };
};
