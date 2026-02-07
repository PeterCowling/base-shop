 
import { memo } from "react";

import { BASE_URL } from "@/config/site";
import IMAGE_MANIFEST from "@/data/imageManifest";
import { buildHotelNode,ORG_ID } from "@/utils/schema";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";

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

const orgJson = serializeJsonLdValue({
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
