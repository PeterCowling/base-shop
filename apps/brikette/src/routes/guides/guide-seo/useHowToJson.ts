import { useMemo } from "react";

import type { AppLanguage } from "@/i18n.config";

import type { GuideSeoTemplateContext, HowToStep } from "./types";
import { buildHowToPayload } from "@/utils/seo/jsonld";

function isHowToObjectPayload(value: unknown): value is {
  steps?: readonly HowToStep[] | null;
  extras?: Record<string, unknown> | null | undefined;
} {
  return !!value && !Array.isArray(value);
}

interface UseHowToJsonArgs {
  // Accept unknown here to allow defensive handling and easier testing
  buildHowToSteps?: (context: GuideSeoTemplateContext) => unknown;
  context: GuideSeoTemplateContext;
  includeHowToStructuredData: boolean;
}

export function useHowToJson({
  buildHowToSteps,
  context,
  includeHowToStructuredData,
}: UseHowToJsonArgs): string | null {
  return useMemo(() => {
    let steps: readonly HowToStep[] | null = null;
    let extras: Record<string, unknown> | null | undefined;

    if (typeof buildHowToSteps === "function") {
      const custom = buildHowToSteps(context);
      if (Array.isArray(custom)) {
        steps = custom;
      } else if (isHowToObjectPayload(custom)) {
        if (Array.isArray(custom.steps)) {
          steps = custom.steps;
        } else if (custom.steps) {
          steps = [];
        }
        if (custom.extras && typeof custom.extras === "object") {
          extras = custom.extras;
        }
      } else if (custom) {
        steps = [];
      }
    }

    if (!steps && includeHowToStructuredData) {
      steps = context.sections.map((section) => ({
        name: section.title,
        text: section.body.join(" "),
      }));
    }

    if (!steps || steps.length === 0) return null;

    const contentLanguage: AppLanguage | "en" = context.hasLocalizedContent ? context.lang : "en";
    const payload = buildHowToPayload({
      lang: contentLanguage,
      url: context.canonicalUrl,
      name: context.article.title,
      steps,
      extras: extras ?? undefined,
    });

    return payload ? JSON.stringify(payload) : null;
  }, [buildHowToSteps, context, includeHowToStructuredData]);
}
