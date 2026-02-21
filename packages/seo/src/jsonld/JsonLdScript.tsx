import React from "react";

import { serializeJsonLdValue } from "./serialize.js";

/**
 * Render a `<script type="application/ld+json">` tag with XSS-safe serialization.
 * Uses `suppressHydrationWarning` to avoid SSR/CSR mismatch warnings.
 */
export function JsonLdScript({ value }: { value: unknown }) {
  if (value == null) return null;
  return (
    <script
      // i18n-exempt -- SEO-04 MIME type constant, not user-facing copy [ttl=2027-12-31]
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: serializeJsonLdValue(value) }}
    />
  );
}
