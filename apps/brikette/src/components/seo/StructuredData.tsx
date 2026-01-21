/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// src/components/seo/StructuredData.tsx
/* ─────────────────────────────────────────────────────────────
   Breadcrumb only – the heavy hotel graph now lives in the
   Home page and nowhere else
---------------------------------------------------------------- */
import { memo, useMemo } from "react";

import type { BreadcrumbList } from "@/utils/seo";

function StructuredData({ breadcrumb }: { breadcrumb: BreadcrumbList }): JSX.Element {
  const breadcrumbJson = useMemo(() => JSON.stringify(breadcrumb), [breadcrumb]);

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: breadcrumbJson }}
    />
  );
}

export default memo(StructuredData);
