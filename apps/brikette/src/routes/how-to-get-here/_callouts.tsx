import type { ReactNode } from "react";

import { findPlaceholderBinding } from "@/lib/how-to-get-here/definitions";

import { isLinkedCopy, renderLinkedCopy, renderRichText } from "./linking";
import type { BindingLookupResult, RenderContext } from "./types";

export type NormalizedCallout =
  | { kind: "richText"; text: string; candidates: Array<string | null> }
  | { kind: "linked"; value: { before?: string; linkLabel: string; after?: string }; candidates: Array<string | null> }
  | {
      kind: "list";
      intro?: string;
      introCandidates: Array<string | null>;
      items: string[];
      itemsKey: string;
    };

function getString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function getStringArray(record: Record<string, unknown>, key: string): string[] | undefined {
  const value = record[key];
  if (!Array.isArray(value)) return undefined;
  const items = value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
  return items.length > 0 ? items : undefined;
}

function tryCreateListCallout(
  bodyText: string | undefined,
  listItems: string[] | undefined,
  listKey: string | undefined,
  introCandidates: Array<string | null>,
): NormalizedCallout | null {
  if (!bodyText || !listItems || !listKey) return null;
  return {
    kind: "list",
    intro: bodyText,
    introCandidates,
    items: listItems,
    itemsKey: listKey,
  };
}

function tryCreateRichTextCallout(
  text: string | undefined,
  candidates: Array<string | null>,
): NormalizedCallout | null {
  if (!text) return null;
  return { kind: "richText", text, candidates };
}

function tryCreateLinkedCallout(
  record: Record<string, unknown>,
  candidates: Array<string | null>,
): NormalizedCallout | null {
  const linkLabel =
    getString(record, "linkLabel") ??
    getString(record, "guideLinkLabel") ??
    getString(record, "ctaLinkLabel");

  if (!linkLabel) return null;

  const before =
    getString(record, "beforeLink") ??
    getString(record, "before") ??
    getString(record, "intro") ??
    getString(record, "prefix");
  const after =
    getString(record, "afterLink") ??
    getString(record, "after") ??
    getString(record, "outro") ??
    getString(record, "suffix");

  if (!before && !after) return null;

  const linkedValue = {
    linkLabel,
    ...(before !== undefined ? { before } : {}),
    ...(after !== undefined ? { after } : {}),
  };
  return {
    kind: "linked",
    value: linkedValue,
    candidates,
  } satisfies NormalizedCallout;
}

export function normalizeCalloutContent(record: Record<string, unknown>): NormalizedCallout | null {
  const listKeyCandidates = ["items", "list", "points"] as const;
  const listKey = listKeyCandidates.find((key) => getStringArray(record, key));
  const listItems = listKey ? getStringArray(record, listKey) : undefined;

  // Try body string
  const bodyString = getString(record, "body");
  const bodyList = tryCreateListCallout(bodyString, listItems, listKey, ["body", "copy", "description", null]);
  if (bodyList) return bodyList;
  const bodyRichText = tryCreateRichTextCallout(bodyString, ["body", "copy", null]);
  if (bodyRichText) return bodyRichText;

  // Try copy string
  const copyString = getString(record, "copy");
  const copyList = tryCreateListCallout(copyString, listItems, listKey, ["copy", "body", "description", null]);
  if (copyList) return copyList;
  const copyRichText = tryCreateRichTextCallout(copyString, ["copy", "body", null]);
  if (copyRichText) return copyRichText;

  // Try description string
  const descriptionString = getString(record, "description");
  const descList = tryCreateListCallout(descriptionString, listItems, listKey, ["description", "body", "copy", null]);
  if (descList) return descList;
  const descRichText = tryCreateRichTextCallout(descriptionString, ["description", "body", "copy", null]);
  if (descRichText) return descRichText;

  // Try linked copy objects
  const bodyValue = record["body"];
  if (isLinkedCopy(bodyValue)) {
    return { kind: "linked", value: bodyValue, candidates: ["body", "copy", null] };
  }

  const copyValue = record["copy"];
  if (isLinkedCopy(copyValue)) {
    return { kind: "linked", value: copyValue, candidates: ["copy", "body", null] };
  }

  // List without intro
  if (listItems && listKey) {
    return {
      kind: "list",
      intro: undefined,
      introCandidates: [null],
      items: listItems,
      itemsKey: listKey,
    };
  }

  // Try creating linked callout from link label
  return tryCreateLinkedCallout(record, ["copy", "body", null]);
}

function pickCalloutBinding(
  definition: RenderContext["definition"],
  path: string,
  candidates: Array<string | null>,
): BindingLookupResult {
  const attempts = candidates.length > 0 ? candidates : [null];
  for (const candidate of attempts) {
    const bindingPath = candidate ? `${path}.${candidate}` : path;
    const binding = findPlaceholderBinding(definition, bindingPath);
    if (binding) {
      return { binding, bindingPath };
    }
  }

  const fallback = attempts[0];
  const bindingPath = fallback ? `${path}.${fallback}` : path;
  return { binding: undefined, bindingPath };
}

export function renderCallout(path: string, value: unknown, ctx: RenderContext): ReactNode | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const normalized = normalizeCalloutContent(record);
  if (!normalized) return null;

  const label = (record["label"] ?? record["title"] ?? record["eyebrow"] ?? record["name"]) as
    | ReactNode
    | undefined;

  const contentNode = (() => {
    if (normalized.kind === "list") {
      const introNode = (() => {
        if (!normalized.intro) return null;
        const { binding, bindingPath } = pickCalloutBinding(ctx.definition, path, normalized.introCandidates);
        const node = renderRichText(normalized.intro, bindingPath, binding, ctx);
        return node === null || node === undefined ? null : (
          <p className="leading-relaxed text-brand-text dark:text-brand-text">{node}</p>
        );
      })();

      const itemNodes = normalized.items
        .map((item, index) => {
          const itemPath = `${path}.${normalized.itemsKey}.${index}`;
          const binding =
            findPlaceholderBinding(ctx.definition, itemPath) ??
            findPlaceholderBinding(ctx.definition, `${path}.${normalized.itemsKey}`) ??
            findPlaceholderBinding(ctx.definition, path);
          const node = renderRichText(item, itemPath, binding, ctx);
          if (node === null || node === undefined) return null;
          return <li key={itemPath}>{node}</li>;
        })
        .filter(Boolean);

      if (!introNode && itemNodes.length === 0) {
        return null;
      }

      return (
        <div className="space-y-3">
          {introNode}
          {itemNodes.length > 0 ? (
            <ul className="list-disc space-y-2 pl-5 leading-relaxed text-brand-text dark:text-brand-text">
              {itemNodes}
            </ul>
          ) : null}
        </div>
      );
    }

    const { binding, bindingPath } = pickCalloutBinding(ctx.definition, path, normalized.candidates);
    const node =
      normalized.kind === "richText"
        ? renderRichText(normalized.text, bindingPath, binding, ctx)
        : renderLinkedCopy(normalized.value, bindingPath, binding, ctx, bindingPath);
    if (node === null || node === undefined) {
      return null;
    }
    return <p className="leading-relaxed text-brand-text dark:text-brand-text">{node}</p>;
  })();

  if (!contentNode) return null;

  return (
    <aside
      key={path}
      className="rounded-3xl border border-brand-outline/30 bg-brand-primary/5 p-6 text-sm shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/10"
    >
      {label ? <p className="font-semibold uppercase tracking-widest text-brand-secondary">{label}</p> : null}
      <div className="mt-2">{contentNode}</div>
    </aside>
  );
}
