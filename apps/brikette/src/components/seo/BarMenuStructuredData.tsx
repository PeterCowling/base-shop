// src/components/seo/BarMenuStructuredData.tsx
import React, { memo } from "react";

type Props = {
  json: string;
  type?: string;
};

function BarMenuStructuredData({ json, type = "application/ld+json" }: Props): JSX.Element {
  return (
    <script type={type} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: json }} />
  );
}

export default memo(BarMenuStructuredData);
