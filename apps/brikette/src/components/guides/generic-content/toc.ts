// src/components/guides/generic-content/toc.ts
import { nextStableKey, normaliseKeySeedFromUnknown } from "./keys";
import { isRecord, toTrimmedString } from "./strings";
import { debugGuide } from "@/utils/debug";
import type {
  ResolvedSection,
  SupplementalNavEntry,
  TocItem,
  TocOverrides,
} from "./types";

type SectionFallbackResolver = (position: number) => string;

const DEBUG_KEYS = {
  tocNavItems: "guides.genericContent.toc.items",
} as const;

const defaultSectionLabel: SectionFallbackResolver = (position) => `Section ${position}`; // i18n-exempt -- TECH-000 [ttl=2026-12-31] legacy fallback for tests; UI uses translated resolver

export function toTocItems(
  value: unknown,
  getFallbackLabel: SectionFallbackResolver = defaultSectionLabel,
): TocItem[] {
  if (!Array.isArray(value)) return [];

  return value.map((item, index) => {
    const position = index + 1; // human-friendly numbering
    const fallbackLabel = getFallbackLabel(position);
    const fallbackHref = `#s-${index}`;

    const isObj = isRecord(item);
    const rawLabel = isObj ? toTrimmedString((item as Record<string, unknown>)["label"]) : undefined;
    const rawHref = isObj ? toTrimmedString((item as Record<string, unknown>)["href"]) : undefined;

    const label = rawLabel ?? fallbackLabel;
    const href = ((): string => {
      if (!rawHref) return fallbackHref;
      const trimmed = rawHref.trim();
      return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
    })();

    return { href, label };
  });
}

export function normaliseTocOverrides(raw: unknown): TocOverrides {
  if (!isRecord(raw)) {
    return { labels: new Map<string, string>() };
  }

  const labels = new Map<string, string>();
  let title: string | undefined;

  for (const [key, value] of Object.entries(raw)) {
    const text = toTrimmedString(value);
    if (!text) continue;
    if (key === "title" || key === "onThisPage") {
      title = text;
      continue;
    }
    labels.set(key, text);
  }

  return title !== undefined ? { labels, title } : { labels };
}

type BuildTableOfContentsArgs = {
  showToc: boolean;
  tocRaw: unknown;
  sections: ResolvedSection[];
  supplementalNav: SupplementalNavEntry[];
  getFallbackLabel?: SectionFallbackResolver;
};

export function buildTableOfContents({
  showToc,
  tocRaw,
  sections,
  supplementalNav,
  getFallbackLabel,
}: BuildTableOfContentsArgs): TocItem[] | null {
  if (!showToc) {
    return null;
  }

  let navItems: TocItem[] | null = null;
  const fallbackLabelResolver = getFallbackLabel ?? defaultSectionLabel;
  const tocItems = toTocItems(tocRaw, fallbackLabelResolver);

  if (tocItems.length > 0) {
    // Use provided items as-is (already normalised with fallbacks)
    navItems = tocItems.map(({ href, label }) => ({ href: href.trim(), label }));
  } else if (sections.length > 0) {
    // Build from sections using their display label when present; do not require body content.
    navItems = sections
      .filter((section) =>
        (section.includeInToc !== false) &&
        typeof section.label === 'string' && section.label.trim().length > 0,
      )
      .map((section, index) => ({
        href: `#${section.id}`,
        label: section.label.trim() || fallbackLabelResolver(index + 1),
      }));
  } else {
    // Defer to supplemental items if nothing else produced entries
    const trimmedSupplementalNav = supplementalNav.filter((entry) => entry.label.trim().length > 0);
    if (trimmedSupplementalNav.length > 0) navItems = [];
  }

  const appendNavItem = (id: string, label: string) => {
    const trimmedLabel = label.trim();
    if (trimmedLabel.length === 0) {
      return;
    }

    const href = id.startsWith("#") ? id : `#${id}`;
    if (!navItems) {
      navItems = [];
    }

    if (navItems.some((item) => item.href === href)) {
      return;
    }

    navItems.push({ href, label: trimmedLabel });
  };

  // Append supplemental entries (Essentials, Costs, Tips, Warnings, FAQs)
  // after any explicit ToC or section-derived items, preserving input order.
  for (const entry of supplementalNav) {
    const id = typeof entry?.id === 'string' ? entry.id.trim() : '';
    const lbl = typeof entry?.label === 'string' ? entry.label.trim() : '';
    if (!id || !lbl) continue;
    appendNavItem(id, lbl);
  }

  try {
    debugGuide(DEBUG_KEYS.tocNavItems, navItems);
  } catch (err) {
    // Swallow debug errors in production paths while keeping the block non-empty for linting
    void err;
  }
  return navItems;
}

export function applyStableKeys(navItems: TocItem[] | null): TocItem[] | null {
  if (!navItems) {
    return null;
  }

  const counter = new Map<string, number>();
  return navItems.map((item) => {
    const hrefSeed = normaliseKeySeedFromUnknown(item.href);
    const labelSeed = normaliseKeySeedFromUnknown(item.label);
    const seed = hrefSeed ?? labelSeed ?? "item";
    const key = nextStableKey(seed, counter);
    return { ...item, key };
  });
}
