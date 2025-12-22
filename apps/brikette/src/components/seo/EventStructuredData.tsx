/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// src/components/seo/EventStructuredData.tsx
import { memo } from "react";

import { BASE_URL } from "@/config/site";

import { ensureLeadingSlash, normaliseWindowPath, useOptionalRouterPathname } from "./locationUtils";

type Props = {
  name: string;
  startDate: string; // ISO
  endDate?: string; // ISO
  locationName: string;
  addressLocality: string;
  addressRegion?: string;
  addressCountry?: string;
  description?: string;
  image?: string;
  /**
   * Optional override for the canonical path. This is mainly useful in tests
   * where a Router context might not be available.
   */
  path?: string;
};

function EventStructuredData({
  name,
  startDate,
  endDate,
  locationName,
  addressLocality,
  addressRegion = "Campania",
  addressCountry = "IT",
  description,
  image,
  path,
}: Props): JSX.Element {
  const routerPathname = useOptionalRouterPathname();
  const fallbackPath = normaliseWindowPath();
  const pathname = ensureLeadingSlash(path ?? routerPathname ?? fallbackPath ?? "/");
  const json = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    startDate,
    endDate,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: locationName,
      address: {
        "@type": "PostalAddress",
        addressLocality,
        addressRegion,
        addressCountry,
      },
    },
    image,
    description,
    url: `${BASE_URL}${pathname}`,
  });
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export default memo(EventStructuredData);
