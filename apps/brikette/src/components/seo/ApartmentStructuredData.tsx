/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// src/components/seo/ApartmentStructuredData.tsx
import graph from "@/schema/apartment.jsonld?raw";
import { memo } from "react";

function ApartmentStructuredData(): JSX.Element {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: graph }} />;
}

export default memo(ApartmentStructuredData);
