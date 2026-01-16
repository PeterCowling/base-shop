// src/components/seo/ApartmentStructuredData.tsx
import graph from "@/schema/apartment.jsonld?raw";
import { memo } from "react";

function ApartmentStructuredData(): JSX.Element {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: graph }} />;
}

export default memo(ApartmentStructuredData);
