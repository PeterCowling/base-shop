import type { AppLanguage } from "@/i18n.config";

import { stripGuideLinkTokens } from "../utils/linkTokens";
import { createFallbackData } from "./createFallbackData";

export function buildGuideFaqFallback(lang: AppLanguage) {
  const data = createFallbackData(lang);
  if (!data.faqs) {
    return [];
  }

  return data.faqs.items.map((item) => {
    const sanitized = stripGuideLinkTokens(item.body || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return {
      q: item.summary || item.body || "",
      a: [sanitized.length > 0 ? sanitized : item.body ?? ""],
    };
  });
}
