 
// src/components/seo/HostelStructuredData.tsx
/*
   Minimal Hostel JSON-LD for the homepage
   Notes:
   - Mirrors the core Hotel node but typed as "Hostel".
   - Omits any third-party reviews to comply with policy.
*/
import { memo } from "react";

import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { buildHotelNode, HOTEL_ID } from "@/utils/schema";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";

function HostelStructuredData(): JSX.Element {
  const lang = useCurrentLanguage();
  const pageUrl = `${BASE_URL}/${lang}`;
  const base = buildHotelNode({ pageUrl, publisher: true });
  // Clone and adapt type to Hostel. Keep core descriptive fields.
  const hostel = { ...base, "@id": HOTEL_ID, "@type": "Hostel" } as Record<string, unknown>;
  const json = serializeJsonLdValue({ "@context": "https://schema.org", ...hostel });

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default memo(HostelStructuredData);
