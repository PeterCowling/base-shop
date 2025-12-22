// src/routes/guides/guide-seo/useStructuredTocItems.ts
import { useMemo } from "react";
import { normalizeGuideToc } from "./toc";
import type { GuideSeoTemplateContext, TocItem, GuideSeoTemplateProps } from "./types";

export function useStructuredTocItems(params: {
  context: GuideSeoTemplateContext;
  buildTocItems?: GuideSeoTemplateProps["buildTocItems"];
  suppressUnlocalizedFallback?: boolean;
}): TocItem[] {
  const { context, buildTocItems, suppressUnlocalizedFallback } = params;
  return useMemo(
    () =>
      normalizeGuideToc(context, {
        customBuilderProvided: Boolean(buildTocItems),
        ...(typeof suppressUnlocalizedFallback === "boolean" ? { suppressUnlocalizedFallback } : {}),
      }),
    [context, buildTocItems, suppressUnlocalizedFallback],
  );
}
