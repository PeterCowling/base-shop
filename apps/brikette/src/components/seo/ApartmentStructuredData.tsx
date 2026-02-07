 
// src/components/seo/ApartmentStructuredData.tsx
import { memo } from "react";

import graph from "@/schema/apartment.jsonld?raw";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";

function ApartmentStructuredData(): JSX.Element {
  const json = serializeJsonLdValue(graph);
  if (!json) return <></>;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default memo(ApartmentStructuredData);
