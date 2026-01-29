 
// src/components/seo/EventStructuredData.tsx
import { memo } from "react";

import { buildCanonicalUrl } from "@acme/ui/lib/seo/buildCanonicalUrl";

import { BASE_URL } from "@/config/site";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";

import { ensureLeadingSlash, useOptionalRouterPathname } from "./locationUtils";

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
  // Use Next.js router pathname directly. Avoid window.location fallback to prevent
  // server/client hydration mismatches. usePathname() works reliably in App Router.
  const routerPathname = useOptionalRouterPathname();
  const pathname = ensureLeadingSlash(path ?? routerPathname ?? "/");
  const json = serializeJsonLdValue({
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
    url: buildCanonicalUrl(BASE_URL, pathname),
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
