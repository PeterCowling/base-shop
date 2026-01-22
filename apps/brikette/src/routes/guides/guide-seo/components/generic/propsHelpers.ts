/**
 * Props preparation helpers for GenericOrFallbackContent.
 */
import type { TocItem } from "../../types";

/**
 * Attach article description to props if available.
 */
export function attachArticleDescription(
  props: unknown,
  articleDescription: string | undefined,
): unknown {
  if (!articleDescription || !props || typeof props !== "object") {
    return props;
  }
  (props as Record<string, unknown>)["articleDescription"] = articleDescription;
  return props;
}

/**
 * Attach coverage metadata for test environments.
 */
export function attachCoverageMetadata(
  props: unknown,
  context: Record<string, unknown>,
  structuredTocItems: TocItem[] | null | undefined,
): unknown {
  if (process.env.NODE_ENV !== "test") return props;
  if (!props || typeof props !== "object") return props;

  const target = props as Record<string, unknown>;

  // Sections coverage
  const sectionsForCoverage = Array.isArray(context?.sections) ? (context.sections as unknown[]) : [];
  if (sectionsForCoverage.length > 0) {
    target["__coverageSections"] = sectionsForCoverage;
  }

  // Intro coverage
  const introForCoverage = Array.isArray(context?.intro)
    ? (context.intro as unknown[])
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter((entry) => entry.length > 0)
    : [];
  if (introForCoverage.length > 0) {
    target["__coverageIntro"] = introForCoverage;
  }

  // FAQs coverage
  const faqsForCoverage = Array.isArray(context?.faqs)
    ? (context.faqs as Array<{ q?: unknown; a?: unknown }>)
        .map((faq) => {
          const question = typeof faq?.q === "string" ? faq.q.trim() : "";
          const answers = Array.isArray(faq?.a)
            ? (faq.a as unknown[])
                .map((answer) => (typeof answer === "string" ? answer.trim() : ""))
                .filter((answer) => answer.length > 0)
            : [];
          if (!question || answers.length === 0) return null;
          return { q: question, a: answers };
        })
        .filter((faq): faq is { q: string; a: string[] } => faq != null)
    : [];
  if (faqsForCoverage.length > 0) {
    target["__coverageFaqs"] = faqsForCoverage;
  }

  // ToC coverage
  const tocForCoverage = Array.isArray(structuredTocItems)
    ? structuredTocItems
        .map((item) => {
          const href = typeof item?.href === "string" ? item.href.trim() : "";
          const label = typeof item?.label === "string" ? item.label.trim() : "";
          if (!href || !label) return null;
          return { href, label };
        })
        .filter((item): item is { href: string; label: string } => item != null)
    : [];
  if (tocForCoverage.length > 0) {
    target["__coverageTocItems"] = tocForCoverage;
  }

  return props;
}

/**
 * Combine article description and coverage metadata into props.
 */
export function preparePropsForRender(
  props: unknown,
  articleDescription: string | undefined,
  context: Record<string, unknown>,
  structuredTocItems: TocItem[] | null | undefined,
): unknown {
  return attachCoverageMetadata(
    attachArticleDescription(props, articleDescription),
    context,
    structuredTocItems,
  );
}

/**
 * Apply section extras from generic content options to props.
 */
export function applySectionExtras(
  props: unknown,
  genericContentOptions: Record<string, unknown> | undefined,
): unknown {
  if (!props || typeof props !== "object") return props;
  if (!genericContentOptions) return props;

  try {
    const extrasTop = genericContentOptions.sectionTopExtras;
    const extrasBottom = genericContentOptions.sectionBottomExtras;
    if (extrasTop || extrasBottom) {
      return {
        ...(props as Record<string, unknown>),
        ...(extrasTop ? { sectionTopExtras: extrasTop } : {}),
        ...(extrasBottom ? { sectionBottomExtras: extrasBottom } : {}),
      };
    }
  } catch {
    /* noop */
  }

  return props;
}

/**
 * Check if intro should be suppressed due to description duplication.
 */
export function shouldSuppressIntroForDescriptionDupe(
  context: Record<string, unknown>,
  props: Record<string, unknown>,
): boolean {
  try {
    const descRaw = context?.article && (context.article as Record<string, unknown>)?.description;
    const desc = typeof descRaw === "string" ? descRaw.trim() : "";
    if (!desc) return false;

    // Prefer the intro that GenericContent will render (via its translator in props)
    let introFirst = "";
    try {
      const tGen = props?.t as ((k: string, o?: Record<string, unknown>) => unknown) | undefined;
      const gk = props?.guideKey as string | undefined;
      const arr =
        typeof tGen === "function" && gk
          ? (tGen(`content.${gk}.intro`, { returnObjects: true }) as unknown)
          : undefined;
      if (Array.isArray(arr) && typeof arr[0] === "string") {
        introFirst = String(arr[0]).trim();
      }
    } catch {
      /* noop */
    }

    // Fall back to context intro
    if (!introFirst) {
      const introArr = Array.isArray(context?.intro) ? (context.intro as unknown[]) : [];
      introFirst = typeof introArr[0] === "string" ? (introArr[0] as string).trim() : "";
    }

    return desc.toLowerCase() === introFirst.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Apply suppress intro flag if needed.
 */
export function applyIntroSuppression(
  props: unknown,
  hasStructuredLocal: boolean,
  context: Record<string, unknown>,
): unknown {
  if (!props || typeof props !== "object") return props;

  const propsObj = props as Record<string, unknown>;

  // Suppress if structured local content exists
  if (hasStructuredLocal) {
    return { ...propsObj, suppressIntro: true };
  }

  // Suppress if description duplicates intro
  if (shouldSuppressIntroForDescriptionDupe(context, propsObj)) {
    return { ...propsObj, suppressIntro: true };
  }

  return props;
}
