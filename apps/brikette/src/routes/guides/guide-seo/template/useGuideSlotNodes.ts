import { useMemo, useRef } from "react";
import type { ReactNode } from "react";

import type { GuideSeoTemplateContext, GuideSeoTemplateProps } from "../types";

export function useGuideSlotNodes(params: {
  context: GuideSeoTemplateContext;
  articleLead?: GuideSeoTemplateProps["articleLead"];
  articleExtras?: GuideSeoTemplateProps["articleExtras"];
  afterArticle?: GuideSeoTemplateProps["afterArticle"];
}): {
  articleLeadNode: ReactNode | null;
  articleExtrasNode: ReactNode | null;
  afterArticleNode: ReactNode | null;
} {
  const { context, articleLead, articleExtras, afterArticle } = params;

  const articleLeadNodeRef = useRef<ReactNode | null>(null);
  if (articleLeadNodeRef.current === null) {
    articleLeadNodeRef.current = articleLead ? articleLead(context) : null;
  }

  const articleExtrasNodeRef = useRef<ReactNode | null>(null);
  if (articleExtrasNodeRef.current === null) {
    articleExtrasNodeRef.current = articleExtras ? articleExtras(context) : null;
  }

  const afterArticleNode = useMemo(
    () => (afterArticle ? afterArticle(context) : null),
    [afterArticle, context],
  );

  return {
    articleLeadNode: articleLeadNodeRef.current,
    articleExtrasNode: articleExtrasNodeRef.current,
    afterArticleNode,
  };
}
