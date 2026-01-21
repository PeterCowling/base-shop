import type { AppLanguage } from "@/i18n.config";

import { GUIDE_KEY } from "./porter-service-positano.constants";
import { normaliseFaqs } from "./porter-service-positano.normalisers";
import { getGuidesTranslator } from "./porter-service-positano.translators";
import type { GuideFaq } from "./porter-service-positano.types";
import { stripGuideLinkTokens } from "./utils/linkTokens";

const STRUCTURED_FAQ_FALLBACK_LOCALES = new Set<AppLanguage>(["es"]);

type GuideFaqFallback = (targetLang: string) => GuideFaq[];

export function createGuideFaqFallback(): GuideFaqFallback {
  return (targetLang) => {
    const translator = getGuidesTranslator(targetLang);
    const fallback = getGuidesTranslator("en");
    const sanitize = (faqs: GuideFaq[]) =>
      faqs.map(({ q, a }) => ({ q, a: a.map((answer) => stripGuideLinkTokens(answer)) }));

    const localizedFaqs = sanitize(normaliseFaqs(translator(`content.${GUIDE_KEY}.faqs`, { returnObjects: true })));
    if (localizedFaqs.length > 0) return localizedFaqs;

    const localizedLegacy = sanitize(normaliseFaqs(translator(`content.${GUIDE_KEY}.faq`, { returnObjects: true })));
    if (localizedLegacy.length > 0) return localizedLegacy;

    const englishFaqs = sanitize(normaliseFaqs(fallback(`content.${GUIDE_KEY}.faqs`, { returnObjects: true })));

    if (STRUCTURED_FAQ_FALLBACK_LOCALES.has(targetLang as AppLanguage) && englishFaqs.length > 0) {
      return englishFaqs;
    }

    const englishLegacy = sanitize(normaliseFaqs(fallback(`content.${GUIDE_KEY}.faq`, { returnObjects: true })));
    if (englishLegacy.length > 0) return englishLegacy;

    return englishFaqs;
  };
}
