// src/utils/seo/jsonld/howto.ts
import { normalizeHowToSteps } from "./normalize";

export interface HowToStepInput { name?: unknown; text?: unknown }

export interface BuildHowToInput {
  lang: string;
  url: string;
  name: unknown; // title/name of the HowTo
  steps: unknown; // array-like of { name, text? }
  extras?: Record<string, unknown> | null | undefined; // e.g., totalTime, estimatedCost
}

export function buildHowToPayload(input: BuildHowToInput): Record<string, unknown> | null {
  const steps = normalizeHowToSteps(input.steps);
  if (steps.length === 0) return null;

  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    inLanguage: input.lang,
    url: input.url,
    name: typeof input.name === "string" ? input.name : undefined,
    step: steps,
  };

  if (input.extras && typeof input.extras === "object") {
    for (const [k, v] of Object.entries(input.extras)) {
      if (v !== undefined) payload[k] = v;
    }
  }

  return payload;
}

