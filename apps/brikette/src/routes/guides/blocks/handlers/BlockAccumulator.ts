/**
 * Block accumulator for composing guide template fragments.
 */
import { Children, createElement, Fragment, type ReactNode } from "react";

import type { GuideSection } from "@/data/guides.index";

import type { GuideManifestEntry } from "../../guide-manifest";
import type { GuideSeoTemplateContext, GuideSeoTemplateProps } from "../../guide-seo/types";

type SlotRenderer = (context: GuideSeoTemplateContext) => ReactNode;
type Slots = "lead" | "article" | "after" | "head";

interface AccumulatorSlots {
  lead: SlotRenderer[];
  article: SlotRenderer[];
  after: SlotRenderer[];
  head: SlotRenderer[];
}

export type TemplateFragment = Partial<GuideSeoTemplateProps>;

function normaliseGuideSection(value: unknown): GuideSection | undefined {
  if (value === "help" || value === "experiences") return value;
  return undefined;
}

function mergeTemplateProps(base: TemplateFragment, patch: TemplateFragment): TemplateFragment {
  if (!patch) return { ...base };
  const merged: TemplateFragment = { ...base, ...patch };
  if (base.genericContentOptions || patch.genericContentOptions) {
    merged.genericContentOptions = {
      ...(base.genericContentOptions ?? {}),
      ...(patch.genericContentOptions ?? {}),
    };
  }
  if (base.relatedGuides || patch.relatedGuides) {
    const related = {
      ...(base.relatedGuides ?? {}),
      ...(patch.relatedGuides ?? {}),
    };
    if (Array.isArray(related.items) && related.items.length > 0) {
      merged.relatedGuides = {
        ...related,
        items: [...related.items],
      } as NonNullable<GuideSeoTemplateProps["relatedGuides"]>;
    }
  }
  if (base.alsoHelpful || patch.alsoHelpful) {
    const alsoHelpful = {
      ...(base.alsoHelpful ?? {}),
      ...(patch.alsoHelpful ?? {}),
    };
    if (Array.isArray(alsoHelpful.tags) && alsoHelpful.tags.length > 0) {
      merged.alsoHelpful = {
        ...alsoHelpful,
        tags: [...alsoHelpful.tags],
        excludeGuide: Array.isArray(alsoHelpful.excludeGuide)
          ? [...alsoHelpful.excludeGuide]
          : alsoHelpful.excludeGuide,
        section: normaliseGuideSection(alsoHelpful.section),
      } as NonNullable<GuideSeoTemplateProps["alsoHelpful"]>;
    }
  }
  return merged;
}

function composeSlot(renderers: SlotRenderer[]): ((ctx: GuideSeoTemplateContext) => ReactNode) | undefined {
  if (!renderers.length) return undefined;
  return function GuideBlockSlot(context: GuideSeoTemplateContext): ReactNode {
    const slotChildren = renderers.map((renderer, index) => {
      const node = renderer(context);
      const children = Array.isArray(node) ? Children.toArray(node) : node;
      return createElement(Fragment, { key: `guide-block-slot-${index}` }, children);
    });
    return createElement(Fragment, null, Children.toArray(slotChildren));
  };
}

export class BlockAccumulator {
  private readonly entry: GuideManifestEntry;
  private template: TemplateFragment = {};
  private readonly slots: AccumulatorSlots = {
    lead: [],
    article: [],
    after: [],
    head: [],
  };
  readonly warnings: string[] = [];

  constructor(entry: GuideManifestEntry) {
    this.entry = entry;
  }

  mergeTemplate(partial: TemplateFragment | undefined): void {
    if (!partial) return;
    this.template = mergeTemplateProps(this.template, partial);
  }

  addSlot(slot: Slots, renderer: SlotRenderer | undefined): void {
    if (!renderer) return;
    this.slots[slot].push(renderer);
  }

  warn(message: string): void {
    this.warnings.push(message);
  }

  buildTemplate(): TemplateFragment {
    const template = { ...this.template };
    const lead = composeSlot(this.slots.lead);
    if (lead) template.articleLead = lead;
    const article = composeSlot(this.slots.article);
    if (article) template.articleExtras = article;
    const after = composeSlot(this.slots.after);
    if (after) template.afterArticle = after;
    const head = composeSlot(this.slots.head);
    if (head) template.additionalScripts = head;
    return template;
  }

  get manifest(): GuideManifestEntry {
    return this.entry;
  }
}
