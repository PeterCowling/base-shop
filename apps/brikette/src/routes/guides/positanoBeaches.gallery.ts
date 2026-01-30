import type { GuideSeoTemplateContext } from "./guide-seo/types";

type RawGalleryItem = {
  src?: unknown;
  image?: unknown;
  alt?: unknown;
  caption?: unknown;
  credit?: unknown;
  credits?: unknown;
  width?: unknown;
  height?: unknown;
};

type GalleryBlockItem = {
  image: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
};

function readGalleryFromTranslations(
  translator: GuideSeoTemplateContext["translateGuides"] | undefined,
  key: string,
): unknown {
  if (typeof translator !== "function") return undefined;
  try {
    return translator(key, { returnObjects: true }) as unknown;
  } catch {
    return undefined;
  }
}

function normalizeCredits(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === "string") {
    const v = value.trim();
    return v.length > 0 ? [v] : [];
  }
  return [];
}

function normalizePositiveInt(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const n = Math.floor(value);
  return n > 0 ? n : undefined;
}

function normalizeGalleryItems(raw: unknown, fallbackTitle: string): GalleryBlockItem[] {
  if (!Array.isArray(raw)) return [];

  const out: GalleryBlockItem[] = [];

  raw.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const record = item as RawGalleryItem;

    const imageRaw = record.src ?? record.image;
    const image = typeof imageRaw === "string" ? imageRaw.trim() : "";
    if (!image) return;

    const altRaw = record.alt;
    const alt = typeof altRaw === "string" && altRaw.trim().length > 0 ? altRaw.trim() : fallbackTitle;

    const captionRaw = record.caption;
    const caption =
      typeof captionRaw === "string" && captionRaw.trim().length > 0 ? captionRaw.trim() : undefined;

    const credits = normalizeCredits(record.credits ?? record.credit);
    const captionWithCredits =
      caption && credits.length > 0 ? `${caption} — ${credits.join(" • ")}` : caption;

    const width = normalizePositiveInt(record.width);
    const height = normalizePositiveInt(record.height);

    out.push({
      image,
      alt,
      ...(captionWithCredits ? { caption: captionWithCredits } : {}),
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
    });
  });

  return out;
}

export function buildGuideGallery(args: {
  translator: GuideSeoTemplateContext["translateGuides"];
  englishTranslator: GuideSeoTemplateContext["translateGuides"];
  fallbackTitle: string;
}): GalleryBlockItem[] {
  const key = "content.positanoBeaches.gallery";
  const raw =
    readGalleryFromTranslations(args.translator, key) ??
    readGalleryFromTranslations(args.englishTranslator, key);

  console.log('[positanoBeaches.gallery] Debug:', {
    key,
    hasRaw: !!raw,
    rawType: typeof raw,
    isArray: Array.isArray(raw),
    rawLength: Array.isArray(raw) ? raw.length : 'N/A',
    fallbackTitle: args.fallbackTitle
  });

  const items = normalizeGalleryItems(raw, args.fallbackTitle);
  console.log('[positanoBeaches.gallery] Normalized items:', items.length);

  return items;
}

