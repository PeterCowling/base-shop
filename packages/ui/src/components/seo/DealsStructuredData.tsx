/* ────────────────────────────────────────────────────────────────
   src/components/seo/DealsStructuredData.tsx
   JSON-LD for deals (prop-driven)
---------------------------------------------------------------- */
import { memo } from "react";

import { serializeJsonLd } from "../../lib/seo/serializeJsonLd";

type DealsStructuredDataProps = {
  data?: Record<string, unknown> | unknown[];
  type?: string;
};

function DealsStructuredData({ data, type = "application/ld+json" }: DealsStructuredDataProps): JSX.Element | null {
  if (!data) return null;
  const jsonLd = serializeJsonLd(data);
  if (!jsonLd) return null;
  return <script type={type} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: jsonLd }} />;
}

export default memo(DealsStructuredData);
