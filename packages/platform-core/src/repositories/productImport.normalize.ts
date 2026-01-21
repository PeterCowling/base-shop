import { fillLocales } from "@acme/i18n";
import type { Locale, MediaItem } from "@acme/types";

export function equalJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function inferMediaType(url: string): MediaItem["type"] {
  const lower = url.toLowerCase();
  if (/\.(mp4|mov|webm)(\?|#|$)/.test(lower)) return "video";
  return "image";
}

export function normalizeMedia(
  input: Array<string | Partial<MediaItem>> | undefined,
): MediaItem[] | undefined {
  if (!input) return undefined;
  const items: MediaItem[] = [];
  for (const entry of input) {
    if (typeof entry === "string") {
      const url = entry.trim();
      if (!url) continue;
      items.push({ url, type: inferMediaType(url) });
      continue;
    }
    const url = String(entry.url ?? "").trim();
    if (!url) continue;
    items.push({
      url,
      type: entry.type ?? inferMediaType(url),
      ...(typeof entry.title === "string" && entry.title.trim()
        ? { title: entry.title.trim() }
        : {}),
      ...(typeof entry.altText === "string" && entry.altText.trim()
        ? { altText: entry.altText.trim() }
        : {}),
      ...(Array.isArray(entry.tags)
        ? { tags: entry.tags.map((t) => String(t).trim()).filter(Boolean) }
        : {}),
    });
  }
  return items;
}

export function normalizeTranslatedPatch(
  current: Record<Locale, string>,
  input: string | Partial<Record<Locale, string>>,
): Record<Locale, string> {
  if (typeof input === "string") {
    const value = input.trim();
    return fillLocales({ en: value }, value);
  }
  const patch: Partial<Record<Locale, string>> = {};
  for (const [key, value] of Object.entries(input)) {
    patch[key as Locale] = String(value).trim();
  }
  return fillLocales({ ...current, ...patch }, current.en ?? "");
}

export function normalizeTranslatedCreate(
  input: string | Partial<Record<Locale, string>> | undefined,
  fallback: string,
): Record<Locale, string> {
  if (typeof input === "string") {
    const value = input.trim();
    return fillLocales({ en: value }, value);
  }
  const values: Partial<Record<Locale, string>> = {};
  if (input && typeof input === "object") {
    for (const [key, value] of Object.entries(input)) {
      values[key as Locale] = String(value).trim();
    }
  }
  const fallbackValue =
    values.en ??
    Object.values(values).find((v) => typeof v === "string" && v.trim()) ??
    fallback;
  return fillLocales(values, fallbackValue ?? "");
}

