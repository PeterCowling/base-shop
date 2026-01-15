// src/routes/guides/_GuideSeoTemplate.tsx
import { memo } from "react";

import HeadSection from "./guide-seo/components/HeadSection";
import FaqStructuredDataBlock from "./guide-seo/components/FaqStructuredDataBlock";
import GuideSeoLayout from "./guide-seo/components/GuideSeoLayout";
import { useGuideSeoConfig } from "./guide-seo/useGuideSeoConfig";
import type { GuideSeoTemplateProps } from "./guide-seo/types";
import { useApplyFallbackHead } from "@/utils/testHeadFallback";

function GuideSeoTemplate(props: GuideSeoTemplateProps): JSX.Element {
  const { headSectionProps, faqStructuredDataProps, layoutState, fallbackHeadMeta, fallbackHeadLinks } =
    useGuideSeoConfig(props);

  useApplyFallbackHead(fallbackHeadMeta, fallbackHeadLinks);

  return (
    <>
      <HeadSection {...headSectionProps} />
      <FaqStructuredDataBlock {...faqStructuredDataProps} />
      <GuideSeoLayout {...layoutState} />
    </>
  );
}

export { makeGuideMeta, makeGuideLinks } from "./guide-seo/routeHead";
export default memo(GuideSeoTemplate);
export type { GuideSeoTemplateContext } from "./guide-seo/types";