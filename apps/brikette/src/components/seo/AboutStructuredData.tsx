/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
import { BASE_URL } from "@/config/site";
import { ORG_ID, buildHotelNode } from "@/utils/schema";
import IMAGE_MANIFEST from "@/data/imageManifest";
import { memo } from "react";

const { name, sameAs } = buildHotelNode();
const logoPath = "/img/hostel_brikette_icon.png" as const;
const logoMeta = IMAGE_MANIFEST[logoPath];
const logoNode = logoMeta
  ? {
      "@type": "ImageObject",
      url: `${BASE_URL}${logoPath}`,
      width: logoMeta.width,
      height: logoMeta.height,
    }
  : `${BASE_URL}${logoPath}`;

const orgJson = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name,
  url: BASE_URL,
  logo: logoNode,
  sameAs,
});

function AboutStructuredData(): JSX.Element {
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: orgJson }}
    />
  );
}

export default memo(AboutStructuredData);
