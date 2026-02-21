// src/components/seo/BookStructuredData.tsx
/*
  Book page Hostel JSON-LD with NO third-party aggregateRating

  Notes:
  - Uses buildHotelNode() as base but strips aggregateRating + additionalProperty
  - Complies with policy: omit aggregateRating unless first-party reviews exist
  - Includes mainEntityOfPage for /book page context
*/

import { memo } from "react";

import { BASE_URL } from "@/config/site";
import type { AppLanguage } from "@/i18n.config";
import { buildHotelNode, HOTEL_ID } from "@/utils/schema";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";

interface BookStructuredDataProps {
  lang: AppLanguage;
}

function BookStructuredData({ lang }: BookStructuredDataProps): JSX.Element {
  const pageUrl = `${BASE_URL}/${lang}/book`;
  const base = buildHotelNode({ pageUrl, lang });

  // Clone and strip third-party ratings + related metadata
  const hostel = { ...base, "@id": HOTEL_ID, "@type": "Hostel" } as Record<string, unknown>;

  // CRITICAL: Remove aggregateRating (third-party sources)
  delete hostel.aggregateRating;

  // Remove additionalProperty (contains ratingsSnapshotDate)
  delete hostel.additionalProperty;

  const json = serializeJsonLdValue({ "@context": "https://schema.org", ...hostel });

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default memo(BookStructuredData);
