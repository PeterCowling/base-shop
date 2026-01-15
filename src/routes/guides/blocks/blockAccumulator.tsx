import { Children, Fragment, createElement, type ReactNode } from "react";

import type { GuideManifestEntry } from "../guide-manifest";
import type { GuideSeoTemplateContext, GuideSeoTemplateProps } from "../guide-seo/types";

export type SlotRenderer = (context: GuideSeoTemplateContext) => ReactNode;
export type Slots = "lead" | "article" | "after" | "head";

type AccumulatorSlots = Record<Slots, SlotRenderer[]>;

export type TemplateFragment = Partial<GuideSeoTemplateProps>;

function composeSlot(renderers: SlotRenderer[]): SlotRenderer | undefined {
  if (!renderers.length) return undefined;
  const renderSlot: SlotRenderer = (context) => {
    const slotChildren = renderers.map((renderer, index) => {
      const node = renderer(context);
      const children = Array.isArray(node) ? Children.toArray(node) : node;
      return createElement(Fragment, { key: `guide-block-slot-${index}` }, children);
    });
    return createElement(Fragment, null, Children.toArray(slotChildren));
  };
  (renderSlot as { displayName?: string }).displayName = "GuideBlockSlotRenderer";
  return renderSlot;
}

function mergeTemplateProps(base: TemplateFragment, patch: TemplateFragment | undefined): TemplateFragment {
  if (!patch) return { ...base };
  const merged: TemplateFragment = { ...base, ...patch };
  if (base.genericContentOptions || patch.genericContentOptions) {
    merged.genericContentOptions = {
      ...(base.genericContentOptions ?? {}),
      ...(patch.genericContentOptions ?? {}),
    };
  }
  if (base.relatedGuides || patch.relatedGuides) {
    merged.relatedGuides = {
      ...(base.relatedGuides ?? {}),
      ...(patch.relatedGuides ?? {}),
    };
  }
  if (base.alsoHelpful || patch.alsoHelpful) {
    merged.alsoHelpful = {
      ...(base.alsoHelpful ?? {}),
      ...(patch.alsoHelpful ?? {}),
    };
  }
  return merged;
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
