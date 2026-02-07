// src/components/seo/FaqJsonLdScript.tsx
import { memo } from "react";

import { serializeJsonLdValue } from "@/utils/seo/jsonld";

type Props = {
  data?: Record<string, unknown> | null;
  fallback?: Record<string, unknown> | null;
  type?: string;
};

function FaqJsonLdScript({ data, fallback, type = "application/ld+json" }: Props): JSX.Element | null {
  const payload = data ?? fallback ?? null;
  const json = serializeJsonLdValue(payload);
  if (!json) return null;
  return <script type={type} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: json }} />;
}

export default memo(FaqJsonLdScript);
