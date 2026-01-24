/* eslint-disable ds/no-hardcoded-copy -- SEO-315 [ttl=2026-12-31] Schema.org structured data literals are non-UI. */
// src/components/seo/HowToJsonLd.tsx
import { memo } from "react";

import { buildHowToPayload } from "@/utils/seo/jsonld";

type HowToStep = { name: string; text?: string };

export interface HowToJsonLdProps {
  lang: string;
  url: string;
  steps: readonly HowToStep[];
  totalTimeISO?: string;
  estimatedCost?: { currency: string; value: number };
}

function HowToJsonLd({ lang, url, steps, totalTimeISO, estimatedCost }: HowToJsonLdProps): JSX.Element {
  const payload = buildHowToPayload({
    lang,
    url,
    name: undefined,
    steps,
    extras: {
      ...(totalTimeISO ? { totalTime: totalTimeISO } : {}),
      ...(estimatedCost ? { estimatedCost: { "@type": "MonetaryAmount", ...estimatedCost } } : {}),
    },
  });
  const json = payload ? JSON.stringify(payload) : "";

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default memo(HowToJsonLd);
