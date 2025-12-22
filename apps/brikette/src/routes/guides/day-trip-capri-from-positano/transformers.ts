// src/routes/guides/day-trip-capri-from-positano/transformers.ts
import { ensureArray, ensureStringArray } from "@/utils/i18nContent";

import { safeString } from "./safeString";
import type { FallbackSection, GuideFaq, TocEntry } from "./types";

export function toTocItems(value: unknown): TocEntry[] {
  const items = ensureArray<Record<string, unknown>>(value);
  return items
    .map((entry) => {
      const href = safeString(entry["href"]);
      const label = safeString(entry["label"], href);
      if (!href || !label) return null;
      return { href, label } satisfies TocEntry;
    })
    .filter((item): item is TocEntry => item != null);
}

export function toFallbackSections(value: unknown): FallbackSection[] {
  const entries = ensureArray<Record<string, unknown>>(value);
  return entries
    .map((entry, index) => {
      const title = safeString(entry["title"], `Section ${index + 1}`);
      const id = safeString(entry["id"], title.replace(/\s+/g, "-").toLowerCase());
      const body = ensureStringArray(entry["body"])
        .map((paragraph) => safeString(paragraph))
        .filter((paragraph) => paragraph.length > 0);
      const list = ensureStringArray(entry["list"])
        .map((item) => safeString(item))
        .filter((item) => item.length > 0);
      if (body.length === 0 && list.length === 0) {
        return null;
      }
      return { id, title, body, list } satisfies FallbackSection;
    })
    .filter((section): section is FallbackSection => section != null);
}

export function toFaqEntries(value: unknown): GuideFaq[] {
  const entries = ensureArray<Record<string, unknown>>(value);
  return entries
    .map((entry) => {
      const q = safeString(entry["q"]);
      const a = ensureStringArray(entry["a"]).map((answer) => safeString(answer)).filter((answer) => answer.length > 0);
      if (!q || a.length === 0) {
        return null;
      }
      return { q, a } satisfies GuideFaq;
    })
    .filter((faq): faq is GuideFaq => faq != null);
}

export function toGalleryCopy(value: unknown): Record<string, { alt: string; caption: string }> {
  if (!value) return {};

  if (Array.isArray(value)) {
    return (value as unknown[]).reduce<Record<string, { alt: string; caption: string }>>((acc, item, index) => {
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        const key = safeString(record["key"], String(index));
        const alt = safeString(record["alt"]);
        const caption = safeString(record["caption"], alt);
        if (alt.length > 0 || caption.length > 0) {
          acc[key] = {
            alt: alt.length > 0 ? alt : caption,
            caption: caption.length > 0 ? caption : alt,
          } satisfies { alt: string; caption: string };
        }
      } else if (typeof item === "string" && item.trim().length > 0) {
        const trimmed = item.trim();
        acc[String(index)] = { alt: trimmed, caption: trimmed } satisfies { alt: string; caption: string };
      }
      return acc;
    }, {});
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, { alt: string; caption: string }>>(
      (acc, [key, raw]) => {
        if (!raw || typeof raw !== "object") return acc;
        const record = raw as Record<string, unknown>;
        const alt = safeString(record["alt"]);
        const caption = safeString(record["caption"], alt);
        if (alt.length === 0 && caption.length === 0) {
          return acc;
        }
        acc[key] = {
          alt: alt.length > 0 ? alt : caption,
          caption: caption.length > 0 ? caption : alt,
        } satisfies { alt: string; caption: string };
        return acc;
      },
      {},
    );
  }

  return {};
}

export function toHowToSteps(value: unknown): { name: string; text?: string }[] {
  const entries = ensureArray<unknown>(value);
  return entries
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === "string") {
        const name = safeString(entry);
        return name.length > 0 ? ({ name } satisfies { name: string; text?: string }) : null;
      }
      if (typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        const name = safeString(record["name"]);
        if (!name) return null;
        const text = safeString(record["text"]);
        return text.length > 0
          ? ({ name, text } satisfies { name: string; text?: string })
          : ({ name } satisfies { name: string; text?: string });
      }
      return null;
    })
    .filter((step): step is { name: string; text?: string } => step != null);
}
