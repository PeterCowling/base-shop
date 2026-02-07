// src/components/seo/BreakfastMenuStructuredData.tsx
import React, { memo } from "react";

import { serializeJsonLdValue } from "@/utils/seo/jsonld";

type Props = {
  graph: unknown;
  type?: string;
  dataId?: string;
  lang?: string;
};

function BreakfastMenuStructuredData({
  graph,
  type = "application/ld+json",
  dataId,
  lang,
}: Props): JSX.Element | null {
  const json = serializeJsonLdValue(graph);
  if (!json) return null;
  return (
    <script
      type={type}
      {...(dataId ? { "data-id": dataId } : {})}
      {...(lang ? { "data-lang": lang } : {})}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

export default memo(BreakfastMenuStructuredData);
