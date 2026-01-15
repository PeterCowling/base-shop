import type { GuideBlockDeclaration, GuideBlockType } from "../../../src/routes/guides/blocks/types";
import { GUIDE_BLOCK_TYPES } from "../../../src/routes/guides/blocks/types";
import type { GuideKey } from "../../../src/routes.guides-helpers";

import { toPascalCase } from "../lib/utils";

export type BlockDoc = {
  label: string;
  description: string;
  defaultOptions?: Record<string, unknown>;
  notes?: string[];
};

const DEFAULT_GUIDE_TAG = "positano";

const baseBlockDocs: Record<GuideBlockType, BlockDoc> = {
  hero: {
    label: "hero",
    description: "Hero image plus optional intro paragraphs derived from guide content.",
    defaultOptions: {
      image: "<public-path>/hero.jpg",
      altKey: "content.<guideKey>.heroAlt",
      introLimit: 1,
    },
    notes: ["Uses guide intro copy; ensure the image exists in /public/img or Cloudflare media bucket."],
  },
  genericContent: {
    label: "genericContent",
    description: "Render localized guide copy (intro, sections, FAQs) managed via i18n content JSON.",
    defaultOptions: { contentKey: "<guideKey>", showToc: true },
    notes: [
      "Show/hide Table of Contents via showToc.",
      "Use faqHeadingLevel to nest FAQs under the right heading level.",
    ],
  },
  faq: {
    label: "faq",
    description: "Provide FAQ structured data and fallback answers for GuideSeoTemplate.",
    defaultOptions: { fallbackKey: "<guideKey>", alwaysProvideFallback: true },
    notes: [
      "fallbackKey references `content.<key>.faqs` entries.",
      "alwaysProvideFallback ensures FAQ JSON-LD even when localized entries exist.",
    ],
  },
  gallery: {
    label: "gallery",
    description: "Show a curated image gallery for the guide.",
    defaultOptions: {
      items: [
        { image: "<path>/gallery-01.jpg", alt: "TODO gallery alt" },
        { image: "<path>/gallery-02.jpg", alt: "TODO gallery alt" },
      ],
    },
    notes: [
      "Swap to `source` when an existing gallery builder module should be reused.",
      "Ensure images resolve via Cloudflare or /public assets.",
    ],
  },
  serviceSchema: {
    label: "serviceSchema",
    description: "Inject Service structured data using guide translations for service details.",
    defaultOptions: {
      contentKey: "<guideKey>",
      serviceTypeKey: "content.<guideKey>.serviceType",
      areaServedKey: "content.<guideKey>.areaServed",
    },
    notes: ["Pairs well with luggage/porter/service routes that expose structured booking data."],
  },
  breadcrumbs: {
    label: "breadcrumbs",
    description: "Use when a bespoke breadcrumb builder module exists for the guide.",
    defaultOptions: { module: "./<guide>/breadcrumb" },
    notes: ["Currently reserved for legacy breadcrumbs. Prefer manifest-driven defaults when possible."],
  },
  relatedGuides: {
    label: "relatedGuides",
    description: "Override the default related guides list.",
    defaultOptions: { guides: ["<guideKey>", "<guideKey>"] },
  },
  alsoHelpful: {
    label: "alsoHelpful",
    description: "Display the AlsoHelpful widget filtered by tags or explicit guide exclusions.",
    defaultOptions: { tags: [DEFAULT_GUIDE_TAG] },
    notes: ["Set includeRooms to surface hostel rooms for relevant guides."],
  },
  planChoice: {
    label: "planChoice",
    description: "Force plan choice widget to render even when manifest options disable it.",
  },
  transportNotice: {
    label: "transportNotice",
    description: "Enable the transport disruption notice widget.",
  },
  jsonLd: {
    label: "jsonLd",
    description: "Attach a React component or factory that outputs JSON-LD to <head>.",
    defaultOptions: { module: "./<guide>/<Component>" },
    notes: [
      "module should resolve relative to `src/routes/guides` without extension.",
      "exportName can be used when the module exports multiple helpers.",
    ],
  },

  custom: {
    label: "custom",
    description: "Reserved for advanced integrations. Avoid using in new guides.",
  },
} as const;

export const SUPPORTED_GUIDE_BLOCKS = new Set<GuideBlockType>(
  Object.keys(baseBlockDocs).filter((type) => type !== "custom") as GuideBlockType[],
);

export function getGuideBlockLibrary(): Record<GuideBlockType, BlockDoc> {
  return baseBlockDocs;
}

export function parseGuideBlockType(input: string): GuideBlockType {
  const normalized = input.trim();
  const match = GUIDE_BLOCK_TYPES.find((type) => type === normalized);
  if (!match) {
    throw new Error(`Unknown block type "${input}"`);
  }
  if (!SUPPORTED_GUIDE_BLOCKS.has(match)) {
    throw new Error(`Block type "${input}" is not currently supported by the scaffolder`);
  }
  return match;
}

export function printGuideBlockCatalog(): void {
  const rows = Object.entries(baseBlockDocs).map(([type, doc]) => ({
    type,
    description: doc.description,
    defaults: doc.defaultOptions,
    notes: doc.notes ?? [],
  }));

  console.log("Guide block library");
  console.log("───────────────────");
  for (const row of rows) {
    console.log(`• ${row.type}`);
    console.log(`  ${row.description}`);
    if (row.defaults && Object.keys(row.defaults).length > 0) {
      console.log("  Default options:");
      for (const [key, value] of Object.entries(row.defaults)) {
        console.log(`    - ${key}: ${JSON.stringify(value)}`);
      }
    }
    if (row.notes.length > 0) {
      console.log("  Notes:");
      for (const note of row.notes) {
        console.log(`    - ${note}`);
      }
    }
  }
  console.log();
  console.log("Add blocks via `--blocks hero,genericContent,jsonLd` when running `guide` scaffolds.");
}

export function buildGuideBlock(
  type: GuideBlockType,
  key: GuideKey,
  slug: string,
  tags?: string[],
): GuideBlockDeclaration {
  switch (type) {
    case "hero":
      return {
        type: "hero",
        options: {
          image: `${slug}/hero.jpg`,
          altKey: `content.${key}.heroAlt`,
          introLimit: 1,
        },
      };
    case "genericContent":
      return {
        type: "genericContent",
        options: { contentKey: key, showToc: true },
      };
    case "faq":
      return {
        type: "faq",
        options: { fallbackKey: key, alwaysProvideFallback: true },
      };
    case "gallery":
      return {
        type: "gallery",
        options: {
          items: [
            { image: `${slug}/gallery-01.jpg`, alt: "TODO-TRANSLATE gallery image alt" },
            { image: `${slug}/gallery-02.jpg`, alt: "TODO-TRANSLATE gallery image alt" },
          ],
        },
      };
    case "serviceSchema":
      return {
        type: "serviceSchema",
        options: {
          serviceTypeKey: `content.${key}.serviceType`,
          areaServedKey: `content.${key}.areaServed`,
        },
      };
    case "relatedGuides":
      return {
        type: "relatedGuides",
        options: { guides: [key] },
      };
    case "planChoice":
      return { type: "planChoice", options: {} };
    case "transportNotice":
      return { type: "transportNotice", options: {} };
    case "breadcrumbs":
      return {
        type: "breadcrumbs",
        options: { source: `./${slug}/breadcrumb` },
      };
    case "alsoHelpful": {
      const resolvedTags = Array.isArray(tags) && tags.length > 0 ? tags : [DEFAULT_GUIDE_TAG];
      return {
        type: "alsoHelpful",
        options: { tags: resolvedTags },
      };
    }
    case "jsonLd":
      return {
        type: "jsonLd",
        options: { module: `./${slug}/${toPascalCase(slug)}JsonLd` },
      };
    default:
      throw new Error(`Unsupported guide block type: ${type}`);
  }
}