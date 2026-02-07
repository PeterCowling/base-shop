// src/components/seo/BarMenuStructuredData.tsx
import React, { memo } from "react";

import { serializeJsonLdValue } from "@/utils/seo/jsonld";

type Props = {
  data: unknown;
  type?: string;
};

function BarMenuStructuredData({ data, type = "application/ld+json" }: Props): JSX.Element | null {
  const json = serializeJsonLdValue(data);
  if (!json) return null;
  return (
    <script type={type} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: json }} />
  );
}

export default memo(BarMenuStructuredData);
