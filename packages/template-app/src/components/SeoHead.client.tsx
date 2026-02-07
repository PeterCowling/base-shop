// packages/template-app/src/components/SeoHead.client.tsx
"use client";

import { DefaultSeo, type NextSeoProps } from "next-seo";

interface SeoHeadProps extends NextSeoProps {
  structuredData?: Record<string, unknown> | unknown[];
}

export function SeoHead({ structuredData, ...seoProps }: SeoHeadProps) {
  return (
    <>
      <DefaultSeo {...seoProps} />
      {structuredData && (
        <script
          // i18n-exempt -- SEO-342 [ttl=2026-12-31] JSON-LD script type
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </>
  );
}
