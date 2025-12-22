import type { HTMLAttributeReferrerPolicy } from "react";

import type GuideSeoTemplate from "./_GuideSeoTemplate";
import type { GuideSeoTemplateContext } from "./_GuideSeoTemplate";

export type GuideTemplateProps = Parameters<typeof GuideSeoTemplate>[0];

export interface TocItem {
  href: string;
  label: string;
}

export interface Section {
  id: string;
  title: string;
  body: string[];
}

export interface HowToStepDetail {
  name: string;
  text?: string;
}

export type SectionIds = {
  map: string;
  steps: string;
  alternatives: string;
  costs: string;
  tips: string;
};

export interface GuideExtras {
  intro: string[];
  sections: Section[];
  sectionIds: SectionIds;
  toc: TocItem[];
  map: {
    heading: string;
    iframeTitle: string;
    url: string;
    referrerPolicy: HTMLAttributeReferrerPolicy;
  };
  steps: HowToStepDetail[];
  stepsSource: "primary" | "fallback";
  stepsHeading: string;
  alternatives: {
    heading: string;
    trainHeading: string;
    train: string[];
    ferryHeading: string;
    ferry: string[];
  };
  costs: { heading: string; items: string[] };
  tips: { heading: string; items: string[] };
  ferryCta?: string;
  howTo: {
    totalTime?: string;
    estimatedCostCurrency?: string;
    estimatedCostValue?: string;
  };
}

export interface GuideFaq {
  q: string;
  a: string[];
}

export type { GuideSeoTemplateContext };
