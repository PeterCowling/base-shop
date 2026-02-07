import { createElement, type ReactNode } from "react";
import type { TFunction } from "i18next";

import i18n from "@/i18n";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { asFallbackCarrier } from "@/utils/i18n-types";

import type { GenericContentData } from "./buildContent";
import type { FAQ, GenericContentTranslator } from "./types";

const FAQS_HEADING_KEY = "labels.faqsHeading" as const;
const FAQS_HEADING_FALLBACK_LANG = "en" as AppLanguage;

const normalizeLabelCandidate = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed === FAQS_HEADING_KEY) {
    return "";
  }
  return trimmed;
};

const getGuidesLabel = (lang: string | undefined, key: string): string => {
  if (!lang) {
    return "";
  }
  try {
    const fixed = i18n.getFixedT?.(lang, "guides");
    if (typeof fixed !== "function") {
      return "";
    }
    return normalizeLabelCandidate((fixed as TFunction)(key));
  } catch {
    return "";
  }
};

export const resolveFaqsHeadingLabel = (
  lang: AppLanguage,
  translator: GenericContentTranslator,
): string => {
  try {
    const direct = normalizeLabelCandidate(translator(FAQS_HEADING_KEY) as unknown);
    if (direct) {
      return direct;
    }
  } catch {
    // ignore
  }
  const localized = getGuidesLabel(lang, FAQS_HEADING_KEY);
  if (localized) {
    return localized;
  }
  const fallback = getGuidesLabel(FAQS_HEADING_FALLBACK_LANG, FAQS_HEADING_KEY);
  if (fallback) {
    return fallback;
  }
  return FAQS_HEADING_KEY;
};

const resolveEffectiveFaqs = ({
  content,
  lang,
  aliasKey,
  shouldAppendAliasFaqs,
}: {
  content: GenericContentData;
  lang: AppLanguage;
  aliasKey: string | null;
  shouldAppendAliasFaqs: boolean;
}): FAQ[] => {
  if (aliasKey && shouldAppendAliasFaqs) {
    try {
      // Resolve fallback FAQs via i18n.getFixedT to avoid calling additional hooks.
      const fixed: TFunction | undefined = (i18n.getFixedT?.(lang, "guidesFallback") as unknown as TFunction | undefined);
      const raw = typeof fixed === "function"
        ? (fixed(`${aliasKey}.faqs`, { returnObjects: true }) as unknown)
        : undefined;
      if (Array.isArray(raw)) {
        const arr = Array.isArray(raw) ? (raw as unknown[]) : [];
        type FaqCandidate = { q?: unknown; a?: unknown; answer?: unknown } | Record<string, unknown> | unknown;
        const normalised = arr
          .map((e: FaqCandidate) => {
            const obj = (e ?? {}) as Record<string, unknown>;
            const qVal = obj["q"];
            const q = typeof qVal === "string" ? qVal.trim() : "";
            const aRaw =
              ("a" in obj ? obj["a"] : undefined) ?? ("answer" in obj ? obj["answer"] : undefined);
            const a = Array.isArray(aRaw)
              ? (aRaw as unknown[])
                  .filter((v): v is string => typeof v === "string")
                  .map((v) => v.trim())
                  .filter(Boolean)
              : [];
            if (!q || a.length === 0) return null;
            return { q, a } as { q: string; a: string[] };
          })
          .filter((e): e is { q: string; a: string[] } => e != null);
        if (normalised.length > 0) {
          // Append fallback FAQs after any generic FAQs so tests
          // can assert both Generic and Fallback entries appear.
          return [...content.faqs, ...normalised];
        }
      }
    } catch {
      // ignore and fall back to generic FAQs
    }
  }
  return content.faqs;
};

const resolveEffectiveFaqsTitle = ({
  content,
  lang,
  aliasKey,
  mergeAliasFaqs,
}: {
  content: GenericContentData;
  lang: AppLanguage;
  aliasKey: string | null;
  mergeAliasFaqs: boolean;
}): string => {
  if (aliasKey && mergeAliasFaqs) {
    try {
      const fbLocal: TFunction | undefined = asFallbackCarrier(i18n).__tGuidesFallback as TFunction | undefined;
      const fixed: TFunction | undefined = (i18n.getFixedT?.(lang, "guidesFallback") as unknown as TFunction | undefined);
      const get = (fn: TFunction | undefined, key: string): unknown => (typeof fn === "function" ? (fn as TFunction)(key) : undefined);
      // Prefer the hook-attached fallback translator when present; fall back
      // to getFixedT for environments that provide it.
      const raw1 = get(fbLocal, `${aliasKey}.faqsTitle`) ?? get(fixed, `${aliasKey}.faqsTitle`);
      const raw2 = get(fbLocal, `content.${aliasKey}.faqsTitle`) ?? get(fixed, `content.${aliasKey}.faqsTitle`);
      const pick = (v: unknown, sentinel?: string) => {
        if (typeof v !== "string") return "";
        const s = v.trim();
        if (!s) return "";
        if (sentinel && s === sentinel) return "";
        return s;
      };
      const c2 = pick(raw2, `content.${aliasKey}.faqsTitle`);
      if (c2) return c2;
      const c1 = pick(raw1, `${aliasKey}.faqsTitle`);
      if (c1) return c1;
    } catch {
      // ignore and fall through
    }
  }
  return content.faqsTitle;
};

export function GenericContentFaqSection({
  guideKey,
  content,
  lang,
  t,
  renderTokens,
  faqsHeadingLabel,
  faqHeadingLevel,
  aliasKey,
  mergeAliasFaqs,
  shouldAppendAliasFaqs,
}: {
  guideKey: GuideKey;
  content: GenericContentData;
  lang: AppLanguage;
  t: GenericContentTranslator;
  renderTokens: (value: string, key: string) => ReactNode;
  faqsHeadingLabel: string;
  faqHeadingLevel: 2 | 3;
  aliasKey: string | null;
  mergeAliasFaqs: boolean;
  shouldAppendAliasFaqs: boolean;
}): JSX.Element | null {
  const effectiveFaqs = resolveEffectiveFaqs({ content, lang, aliasKey, shouldAppendAliasFaqs });
  const effectiveFaqsTitle = resolveEffectiveFaqsTitle({ content, lang, aliasKey, mergeAliasFaqs });
  const headingRaw = typeof effectiveFaqsTitle === "string" ? effectiveFaqsTitle.trim() : "";
  // Render FAQs whenever entries exist; fallback the heading label inside
  // the section if an explicit title is not provided.
  const showFaqs = effectiveFaqs.length > 0;
  try {
    if (process.env.NODE_ENV !== "production" && process.env["DEBUG_TOC"] === "1") {
      console.info("GC:showFaqs", { headingRaw, count: effectiveFaqs.length });
    }
  } catch {
    /* noop */
  }
  if (!showFaqs) return null;

  return (
    <section id="faqs" className="scroll-mt-28 space-y-4">
      {(() => {
        const raw = typeof effectiveFaqsTitle === "string" ? effectiveFaqsTitle.trim() : "";
        if (content.faqsTitleSuppressed && raw.length === 0) {
          return null;
        }
        const isRawKey = raw === `content.${guideKey}.faqsTitle` || raw === guideKey || raw.length === 0;
        let fallbackTitle: string;
        if (!isRawKey) {
          fallbackTitle = raw;
        } else if (aliasKey && mergeAliasFaqs) {
          // Prefer an alias-provided FAQs label when available
          try {
            const aliasKeyPath = `content.${aliasKey}.toc.faqs` as const;
            const aliasRaw: unknown = t(aliasKeyPath);
            const alias = typeof aliasRaw === "string" ? aliasRaw.trim() : "";
            if (alias && alias !== aliasKeyPath) {
              fallbackTitle = alias;
            } else {
              fallbackTitle = faqsHeadingLabel;
            }
          } catch {
            fallbackTitle = faqsHeadingLabel;
          }
        } else {
          fallbackTitle = faqsHeadingLabel;
        }
        const HeadingTag: "h2" | "h3" = faqHeadingLevel === 3 ? "h3" : "h2";
        const faqHeadingClassName = [
          "mt-[30px]",
          "text-pretty",
          "text-2xl",
          "font-semibold",
          "leading-snug",
          "tracking-tight",
          "text-brand-heading",
          "sm:text-3xl",
        ].join(" ");
        return createElement(
          HeadingTag,
          {
            id: "faqs",
            className: faqHeadingClassName,
          },
          fallbackTitle,
        );
      })()}
      <div className="space-y-4">
        {effectiveFaqs.map((item, index) => (
          <details
            key={index}
            className="overflow-hidden rounded-2xl border border-brand-outline/20 bg-brand-surface/40 shadow-sm transition-shadow hover:shadow-md dark:border-brand-outline/40 dark:bg-brand-bg/60"
          >
            <summary className="px-4 py-3 text-lg font-semibold leading-snug text-brand-heading sm:text-xl">
              {renderTokens(item.q, `${guideKey}-faq-${index}-question`)}
            </summary>
            {Array.isArray(item.a) ? (
              <div className="space-y-3 px-4 pb-4 pt-1 text-base leading-relaxed text-brand-text/90 sm:text-lg">
                {item.a.map((answer, answerIndex) => (
                  <p key={answerIndex}>
                    {renderTokens(answer, `${guideKey}-faq-${index}-answer-${answerIndex}`)}
                  </p>
                ))}
              </div>
            ) : (
              <p className="px-4 pb-4 pt-1 text-base leading-relaxed text-brand-text/90 sm:text-lg">
                {renderTokens(item.a, `${guideKey}-faq-${index}-answer`)}
              </p>
            )}
          </details>
        ))}
      </div>
    </section>
  );
}
