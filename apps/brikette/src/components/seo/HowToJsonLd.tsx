 
// src/components/seo/HowToJsonLd.tsx
import { memo } from "react";

import { buildHowToPayload } from "@/utils/seo/jsonld";
import { serializeJsonLdValue } from "@/utils/seo/jsonld";

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
  const json = payload ? serializeJsonLdValue(payload) : "";

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export default memo(HowToJsonLd);
