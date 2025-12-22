import enAssistance from "@/locales/en/assistance.json";

import { normaliseContactCta, normaliseQuickLinks } from "./normalise";
import type { ContactCta, QuickLinkItem } from "./types";

type EnglishFallbackMessages = Record<string, unknown>;

const EN_ASSISTANCE_MESSAGES = enAssistance as EnglishFallbackMessages;

export function resolveEnglishValue<T = unknown>(key: string): T | undefined {
  const segments = key.split(".");
  let cursor: unknown = EN_ASSISTANCE_MESSAGES;

  for (const segment of segments) {
    if (!cursor || typeof cursor !== "object") {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[segment];
  }

  return cursor as T | undefined;
}

export const FALLBACK_EN_QUICK_LINKS: QuickLinkItem[] = normaliseQuickLinks(
  resolveEnglishValue("quickLinks"),
);

export const FALLBACK_EN_CONTACT_CTA: ContactCta | null = normaliseContactCta(
  resolveEnglishValue("contactCta"),
);
