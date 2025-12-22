import { findPlaceholderBinding } from "@/lib/how-to-get-here/definitions";
import type { ReactNode } from "react";

import { isLinkedCopy, renderLinkedCopy, renderRichText } from "./linking";
import type { BindingLookupResult, RenderContext } from "./types";

export type NormalizedCallout =
  | { kind: "richText"; text: string; candidates: Array<string | null> }
  | { kind: "linked"; value: { before?: string; linkLabel: string; after?: string }; candidates: Array<string | null> };

function getString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

export function normalizeCalloutContent(record: Record<string, unknown>): NormalizedCallout | null {
  const bodyString = getString(record, "body");
  if (bodyString) {
    return { kind: "richText", text: bodyString, candidates: ["body", "copy", null] };
  }

  const copyString = getString(record, "copy");
  if (copyString) {
    return { kind: "richText", text: copyString, candidates: ["copy", "body", null] };
  }

  const descriptionString = getString(record, "description");
  if (descriptionString) {
    return { kind: "richText", text: descriptionString, candidates: ["description", "body", "copy", null] };
  }

  const bodyValue = record["body"];
  if (isLinkedCopy(bodyValue)) {
    return { kind: "linked", value: bodyValue, candidates: ["body", "copy", null] };
  }

  const copyValue = record["copy"];
  if (isLinkedCopy(copyValue)) {
    return { kind: "linked", value: copyValue, candidates: ["copy", "body", null] };
  }

  const linkLabel =
    getString(record, "linkLabel") ??
    getString(record, "guideLinkLabel") ??
    getString(record, "ctaLinkLabel");

  if (linkLabel) {
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

    if (before || after) {
      const linkedValue = {
        linkLabel,
        ...(before !== undefined ? { before } : {}),
        ...(after !== undefined ? { after } : {}),
      };
      return {
        kind: "linked",
        value: linkedValue,
        candidates: ["copy", "body", null],
      } satisfies NormalizedCallout;
    }
  }

  return null;
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
  const { binding, bindingPath } = pickCalloutBinding(ctx.definition, path, normalized.candidates);

  const contentNode =
    normalized.kind === "richText"
      ? renderRichText(normalized.text, bindingPath, binding, ctx)
      : renderLinkedCopy(normalized.value, bindingPath, binding, ctx, bindingPath);

  if (contentNode === null || contentNode === undefined) {
    return null;
  }

  return (
    <aside
      key={path}
      className="rounded-3xl border border-brand-outline/30 bg-brand-primary/5 p-6 text-sm shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/10"
    >
      {label ? <p className="font-semibold uppercase tracking-widest text-brand-secondary">{label}</p> : null}
      <p className="mt-2 leading-relaxed text-brand-text dark:text-brand-surface">{contentNode}</p>
    </aside>
  );
}
