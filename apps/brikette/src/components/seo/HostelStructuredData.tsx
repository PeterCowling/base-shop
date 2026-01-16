// src/components/seo/HostelStructuredData.tsx
/*
   Minimal Hostel JSON-LD for the homepage
   Notes:
   - Mirrors the core Hotel node but typed as "Hostel".
   - Omits any third-party reviews to comply with policy.
*/
import { BASE_URL } from "@/config/site";
import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { buildHotelNode, HOTEL_ID } from "@/utils/schema";
import { memo, useMemo } from "react";

function HostelStructuredData(): JSX.Element {
  const lang = useCurrentLanguage();
  const pageUrl = `${BASE_URL}/${lang}`;
  const json = useMemo(() => {
    const base = buildHotelNode({ pageUrl, publisher: true });
    // Clone and adapt type to Hostel. Keep core descriptive fields.
    const hostel = { ...base, "@id": HOTEL_ID, "@type": "Hostel" } as Record<string, unknown>;
    return JSON.stringify({ "@context": "https://schema.org", ...hostel });
  }, [pageUrl]);

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default memo(HostelStructuredData);
