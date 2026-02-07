import type { TFunction } from "i18next";

import { FALLBACK_EN_CONTACT_CTA } from "./fallbacks";
import { normaliseContactCta } from "./normalise";
import type { ContactCta } from "./types";

export function useContactCta(
  tAssistance: TFunction<"assistance">,
  tAssistanceEn: TFunction<"assistance">,
): ContactCta | null {
  const contactRaw = tAssistance("contactCta", { returnObjects: true }) as unknown;
  const contactPrimary = normaliseContactCta(contactRaw);
  const contactFallback = normaliseContactCta(
    tAssistanceEn("contactCta", { returnObjects: true }) as unknown,
  );

  return contactPrimary ?? contactFallback ?? FALLBACK_EN_CONTACT_CTA;
}
