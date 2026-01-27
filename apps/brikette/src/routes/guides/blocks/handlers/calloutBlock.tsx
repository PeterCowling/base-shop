/**
 * Callout block handler (TASK-02).
 *
 * Renders callouts with styling parity to legacy route callouts.
 * Supports variants: tip, cta, aside.
 * Copy is sourced from guides namespace and supports link tokens.
 */

import { renderGuideLinkTokens } from "@/routes/guides/utils/linkTokens";

import type { GuideSeoTemplateContext } from "../../guide-seo/types";
import type { CalloutBlockOptions } from "../types";
import { resolveTranslation } from "../utils/stringHelpers";

import type { BlockAccumulator } from "./BlockAccumulator";

/**
 * Variant-specific styling for callout blocks.
 */
const VARIANT_STYLES = {
  tip: {
    container: "rounded-3xl border border-brand-outline/30 bg-brand-primary/5 p-6 text-sm shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/10",
    title: "font-semibold uppercase tracking-widest text-brand-secondary",
    body: "mt-2 leading-relaxed text-brand-text dark:text-brand-text",
  },
  cta: {
    container: "rounded-3xl border border-brand-accent/40 bg-brand-accent/10 p-6 text-sm shadow-md dark:border-brand-accent/30 dark:bg-brand-accent/5",
    title: "font-bold uppercase tracking-wide text-brand-accent dark:text-brand-accent",
    body: "mt-2 leading-relaxed text-brand-text dark:text-brand-text",
  },
  aside: {
    container: "rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm dark:border-gray-700 dark:bg-gray-800/50",
    title: "font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400",
    body: "mt-2 leading-relaxed text-gray-700 dark:text-gray-300",
  },
} as const;

export function applyCalloutBlock(acc: BlockAccumulator, options: CalloutBlockOptions): void {
  acc.addSlot("article", (context: GuideSeoTemplateContext) => {
    const titleText = options.titleKey
      ? resolveTranslation(context.translateGuides, options.titleKey)
      : undefined;

    const bodyText = resolveTranslation(context.translateGuides, options.bodyKey);

    if (!bodyText) {
      if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
        console.warn(`[calloutBlock] Missing body text for key: ${options.bodyKey}`);
      }
      return null;
    }

    const styles = VARIANT_STYLES[options.variant];

    // Render body with link token support
    const keyBase = `content.${context.guideKey}.callouts`;
    const bodyContent = renderGuideLinkTokens(bodyText, context.lang, keyBase);

    return (
      <aside className={styles.container}>
        {titleText ? (
          <p className={styles.title}>{titleText}</p>
        ) : null}
        <div className={styles.body}>
          {bodyContent}
        </div>
      </aside>
    );
  });
}
