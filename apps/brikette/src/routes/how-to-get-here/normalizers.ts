import { TRANSPORT_LINK_KEYS, type GuideKey } from "@/routes.guides-helpers";
import { EXPERIENCE_GUIDE_KEYS } from "@/data/guides.index";

import type {
  DestinationLink,
  DestinationSection,
  DestinationSectionImage,
  ExperienceGuide,
  ExperienceGuidesContent,
  NormalizedDestinationSection,
  NormalizedSorrentoContent,
  RichText,
  RomeColumn,
  RomeOption,
  RomeTable,
  SorrentoContent,
  TransportMode,
} from "./types";

function isRecord(candidate: unknown): candidate is Record<string, unknown> {
  return !!candidate && typeof candidate === "object";
}

export function normalizeToArray<T>(
  value: unknown,
  isItem: (candidate: unknown) => candidate is T,
): T[] {
  if (Array.isArray(value)) {
    return value.filter(isItem);
  }

  if (isItem(value)) {
    return [value];
  }

  if (isRecord(value)) {
    return Object.values(value).filter(isItem) as T[];
  }

  return [];
}

const isSectionImage = (candidate: unknown): candidate is DestinationSectionImage => {
  if (!isRecord(candidate)) {
    return false;
  }

  const image = candidate as Partial<DestinationSectionImage>;
  return typeof image.src === "string" && typeof image.alt === "string";
};

const isDestinationLink = (candidate: unknown): candidate is DestinationLink => {
  if (!isRecord(candidate)) {
    return false;
  }

  const link = candidate as Partial<DestinationLink>;
  return typeof link.label === "string" && typeof link.href === "string";
};

const isDestinationSection = (candidate: unknown): candidate is DestinationSection => {
  if (!isRecord(candidate)) {
    return false;
  }

  const section = candidate as Partial<DestinationSection>;
  const hasLinks =
    Array.isArray(section.links) || (!!section.links && typeof section.links === "object");
  return typeof section.name === "string" && hasLinks;
};

const isRomeColumn = (candidate: unknown): candidate is RomeColumn => {
  if (!isRecord(candidate)) {
    return false;
  }

  const column = candidate as Partial<RomeColumn>;
  const hasPoints = Array.isArray(column.points) || (!!column.points && typeof column.points === "object");
  return typeof column.heading === "string" && hasPoints;
};

const isRomeOption = (candidate: unknown): candidate is RomeOption => {
  if (!isRecord(candidate)) {
    return false;
  }

  const option = candidate as Partial<RomeOption>;
  return (
    !!option.route &&
    isDestinationLink(option.route) &&
    (!option.toRome || isRomeColumn(option.toRome)) &&
    (!option.toHostel || isRomeColumn(option.toHostel))
  );
};

const isStringItem = (candidate: unknown): candidate is string => typeof candidate === "string";

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

export function normalizeDestinationSections(
  value: DestinationSection[] | Record<string, DestinationSection> | DestinationSection | undefined,
): NormalizedDestinationSection[] {
  const sections = normalizeToArray<DestinationSection>(value, isDestinationSection);
  return sections.map((section, index) => {
    const normalizedLinks = normalizeToArray<DestinationLink>(section.links, isDestinationLink);
    const normalizedImage = isSectionImage(section.image) ? section.image : undefined;
    const description = typeof section.description === "string" ? section.description.trim() : "";
    const baseId = slugify(section.name);
    const id = baseId || `destination-${index + 1}`;

    return {
      id,
      name: section.name,
      ...(description ? { description } : {}),
      links: normalizedLinks,
      ...(normalizedImage ? { image: normalizedImage } : {}),
    } satisfies NormalizedDestinationSection;
  });
}

export function normalizeRomeTable(value: RomeTable | Record<string, unknown> | undefined): RomeTable {
  if (isRecord(value) && "headers" in value) {
    const headers = (value as RomeTable).headers;
    const normalizedHeaders = {
      route: typeof headers?.route === "string" ? headers.route : "",
      toRome: typeof headers?.toRome === "string" ? headers.toRome : "",
      toHostel: typeof headers?.toHostel === "string" ? headers.toHostel : "",
    } satisfies RomeTable["headers"];
    const options = normalizeToArray<RomeOption>((value as RomeTable).options, isRomeOption);
    return {
      headers: normalizedHeaders,
      options: options.map((option) => {
        const toRome = isRomeColumn(option.toRome)
          ? option.toRome
          : ({ heading: "", points: [] } as RomeColumn);
        const toHostel = isRomeColumn(option.toHostel)
          ? option.toHostel
          : ({ heading: "", points: [] } as RomeColumn);

        return {
          ...option,
          toRome: {
            heading: toRome.heading ?? "",
            points: normalizeToArray<string>(toRome.points, isStringItem),
          },
          toHostel: {
            heading: toHostel.heading ?? "",
            points: normalizeToArray<string>(toHostel.points, isStringItem),
          },
        } satisfies RomeOption;
      }),
    } satisfies RomeTable;
  }

  return { headers: { route: "", toRome: "", toHostel: "" }, options: [] } satisfies RomeTable;
}

export function normalizeSorrentoContent(
  value: SorrentoContent | Record<string, unknown> | undefined,
): NormalizedSorrentoContent {
  if (isRecord(value) && "title" in value) {
    return {
      title: (value as SorrentoContent).title ?? "",
      links: normalizeToArray<DestinationLink>((value as SorrentoContent).links, isDestinationLink),
    } satisfies NormalizedSorrentoContent;
  }

  return { title: "", links: [] } satisfies NormalizedSorrentoContent;
}

export function resolveRichTextParts(note: RichText | undefined) {
  if (!note || !Array.isArray(note.parts)) return [];
  return note.parts;
}

const TRANSPORT_MODE_VALUES: readonly TransportMode[] = ["bus", "ferry", "train", "car", "walk"] as const;

function isTransportModeValue(candidate: unknown): candidate is TransportMode {
  return typeof candidate === "string" && TRANSPORT_MODE_VALUES.includes(candidate as TransportMode);
}

// Be permissive when validating guide keys for experience planners.
// Use the looser superset exposed by routes.guides-helpers that includes
// manifest-discovered guide keys PLUS explicit component overrides (which
// cover how-to-get-here keys), unioned with curated experience keys.
const CANONICAL_KEYS = TRANSPORT_LINK_KEYS as readonly GuideKey[];
const EXPERIENCE_KEYS = EXPERIENCE_GUIDE_KEYS as readonly GuideKey[];
const PERMISSIVE_KEYS = Array.from(new Set<GuideKey>([...CANONICAL_KEYS, ...EXPERIENCE_KEYS])) as readonly GuideKey[];

const GUIDE_KEY_SET = new Set<GuideKey>(PERMISSIVE_KEYS);
const GUIDE_KEY_LOOKUP = new Map<string, GuideKey>(
  PERMISSIVE_KEYS.map((key) => [key.toLowerCase(), key]),
);

function toGuideKey(value: unknown): GuideKey | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (GUIDE_KEY_SET.size === 0) {
    return trimmed as GuideKey;
  }
  if (GUIDE_KEY_SET.has(trimmed as GuideKey)) {
    return trimmed as GuideKey;
  }
  const fallback = GUIDE_KEY_LOOKUP.get(trimmed.toLowerCase());
  return fallback ?? null;
}

export function normalizeExperienceGuides(value: unknown): ExperienceGuidesContent {
  if (!isRecord(value)) {
    return { eyebrow: "", title: "", description: "", items: [] } satisfies ExperienceGuidesContent;
  }

  const eyebrow = typeof value["eyebrow"] === "string" ? value["eyebrow"] : "";
  const title = typeof value["title"] === "string" ? value["title"] : "";
  const description = typeof value["description"] === "string" ? value["description"] : "";
  const itemsSourceRaw = "items" in value ? (value["items"] as unknown) : undefined;
  const itemsSource = Array.isArray(itemsSourceRaw)
    ? itemsSourceRaw
    : isRecord(itemsSourceRaw)
      ? Object.values(itemsSourceRaw)
      : itemsSourceRaw;
  const itemsRaw = normalizeToArray<Record<string, unknown>>(itemsSource, isRecord);

  const items: ExperienceGuide[] = itemsRaw
    .map((item) => {
      const guideKey = toGuideKey(item["guideKey"]);
      if (!guideKey) {
        return null;
      }

      const label = typeof item["label"] === "string" ? item["label"].trim() : "";
      if (!label) {
        return null;
      }

      const summary = typeof item["summary"] === "string" ? item["summary"].trim() : "";
      const transportModesSource = Array.isArray(item["transportModes"]) ? item["transportModes"] : [];
      const transportModes = transportModesSource.filter(isTransportModeValue) as TransportMode[];

      return {
        guideKey,
        label,
        summary,
        transportModes,
      } satisfies ExperienceGuide;
    })
    .filter((item): item is ExperienceGuide => item !== null);

  return {
    eyebrow,
    title,
    description,
    items,
  } satisfies ExperienceGuidesContent;
}
