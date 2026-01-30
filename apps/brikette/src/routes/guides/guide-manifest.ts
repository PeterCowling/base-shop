// i18n-exempt file -- I18N-4521 [ttl=2026-12-31] Manifest metadata scheduled for localisation migration
/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2176 manifest requires inline editorial defaults */
// src/routes/guides/guide-manifest.ts
import { z } from "zod";

import type { AppLanguage } from "@/i18n.config";
import { i18nConfig } from "@/i18n.config";
import type { GuideKey } from "../../guides/slugs/keys";
import { GUIDE_KEYS, GUIDE_KEYS_WITH_OVERRIDES } from "../../guides/slugs/keys";
import { GUIDE_SLUGS } from "../../guides/slugs/slugs";
import { slugify } from "../../utils/slugify";

import {
  GUIDE_BLOCK_DECLARATION_SCHEMA,
  type GuideBlockDeclaration,
} from "./blocks/types";
import { analyzeGuideCompleteness, analyzeTranslationCoverage, analyzeDateValidation } from "./guide-diagnostics";
import type { GuideChecklistDiagnostics } from "./guide-diagnostics.types";
import type { ManifestOverrides } from "./guide-manifest-overrides";

/**
 * Supported publish status values for guides. These power both routing (draft vs live)
 * and the editorial dashboard surfaces that display the current lifecycle state.
 */
export const GUIDE_STATUS_VALUES = ["draft", "review", "live"] as const;
export type GuideStatus = (typeof GUIDE_STATUS_VALUES)[number];

/**
 * Guides can surface in one or more primary navigation areas. Manifest entries declare
 * every area they are eligible for so the publishing UI can present toggle chips instead
 * of requiring bespoke route components.
 */
export const GUIDE_AREA_VALUES = ["howToGetHere", "help", "experience"] as const;
export type GuideArea = (typeof GUIDE_AREA_VALUES)[number];

export type GuideAreaSlugKey = "howToGetHere" | "assistance" | "experiences";

export function guideAreaToSlugKey(area: GuideArea): GuideAreaSlugKey {
  switch (area) {
    case "help":
      return "assistance";
    case "experience":
      return "experiences";
    case "howToGetHere":
    default:
      return "howToGetHere";
  }
}

/**
 * Manifest-driven checklists let editors see — directly in the CMS/preview — which pieces
 * of a guide still need attention before promotion. Items intentionally stay generic so
 * we can derive them from content analysis in a follow-up iteration.
 */
export const CHECKLIST_ITEM_IDS = ["translations", "jsonLd", "faqs", "content", "media", "seoAudit"] as const;
export type ChecklistItemId = (typeof CHECKLIST_ITEM_IDS)[number];

export const CHECKLIST_STATUS_VALUES = ["missing", "inProgress", "complete"] as const;
export type ChecklistStatus = (typeof CHECKLIST_STATUS_VALUES)[number];

export type GuideChecklistItem = {
  id: ChecklistItemId;
  status: ChecklistStatus;
  note?: string;
};

const CHECKLIST_ITEM_SCHEMA = z.object({
  id: z.enum(CHECKLIST_ITEM_IDS),
  status: z.enum(CHECKLIST_STATUS_VALUES),
  note: z.string().trim().optional(),
});

/**
 * Structured data needs more than a boolean flag. Using a declarative manifest allows us to
 * express both the schema type and any typed parameters the generator should consume.
 */
export const STRUCTURED_DATA_TYPES = [
  "Article",
  "FAQPage",
  "BreadcrumbList",
  "Service",
  "ItemList",
  "HowTo",
] as const;
export type StructuredDataType = (typeof STRUCTURED_DATA_TYPES)[number];

export type StructuredDataDeclaration =
  | StructuredDataType
  | {
      type: StructuredDataType;
      options?: Record<string, unknown> | undefined;
    };

export const GUIDE_TEMPLATE_VALUES = ["help", "experience", "localGuide", "pillar"] as const;
export type GuideTemplate = (typeof GUIDE_TEMPLATE_VALUES)[number];

const STRUCTURED_DATA_SCHEMA = z.union([
  z.enum(STRUCTURED_DATA_TYPES),
  z.object({
    type: z.enum(STRUCTURED_DATA_TYPES),
    options: z.record(z.unknown()).optional(),
  }),
]);

const ARTICLE_LIKE_STRUCTURED_TYPES = new Set<StructuredDataType>([
  "Article",
  "HowTo",
  "FAQPage",
]);

function extractStructuredDataType(
  declaration: StructuredDataDeclaration | undefined,
): StructuredDataType | undefined {
  if (!declaration) return undefined;
  if (typeof declaration === "string") return declaration;
  if (typeof declaration === "object" && declaration !== null) {
    const candidate = (declaration as { type?: unknown }).type;
    if (typeof candidate === "string") {
      return candidate as StructuredDataType;
    }
  }
  return undefined;
}

function hasArticleLikeStructuredData(
  structured: StructuredDataDeclaration[] | undefined,
): boolean {
  if (!structured || structured.length === 0) return true;
  return structured.some((entry) => {
    const type = extractStructuredDataType(entry);
    return Boolean(type && ARTICLE_LIKE_STRUCTURED_TYPES.has(type));
  });
}

/**
 * Route behaviour knobs that map closely to GuideSeoTemplate props. These stay optional so
 * most entries can rely on sensible defaults while bespoke routes can opt-in to overrides.
 */
export type GuideRouteOptions = {
  allowEnglishFallback?: boolean;
  showPlanChoice?: boolean;
  showTransportNotice?: boolean;
  showTagChips?: boolean;
  showTocWhenUnlocalized?: boolean;
  suppressTocTitle?: boolean;
  suppressUnlocalizedFallback?: boolean;
  preferManualWhenUnlocalized?: boolean;
  renderGenericWhenEmpty?: boolean;
  preferGenericWhenFallback?: boolean;
  showRelatedWhenLocalized?: boolean;
  suppressFaqWhenUnlocalized?: boolean;
  fallbackToEnTocTitle?: boolean;
  ogType?: string;
};

export type GuideRouteExpectations = {
  redirectOnly?: boolean;
};

const GUIDE_ROUTE_OPTIONS_SCHEMA = z
  .object({
    allowEnglishFallback: z.boolean().optional(),
    showPlanChoice: z.boolean().optional(),
    showTransportNotice: z.boolean().optional(),
    showTagChips: z.boolean().optional(),
    showTocWhenUnlocalized: z.boolean().optional(),
    suppressTocTitle: z.boolean().optional(),
    suppressUnlocalizedFallback: z.boolean().optional(),
    preferManualWhenUnlocalized: z.boolean().optional(),
    renderGenericWhenEmpty: z.boolean().optional(),
    preferGenericWhenFallback: z.boolean().optional(),
    showRelatedWhenLocalized: z.boolean().optional(),
    suppressFaqWhenUnlocalized: z.boolean().optional(),
    fallbackToEnTocTitle: z.boolean().optional(),
    ogType: z.string().trim().optional(),
  })
  .partial()
  .optional();

const GUIDE_ROUTE_EXPECTATIONS_SCHEMA = z
  .object({
    redirectOnly: z.boolean().optional(),
  })
  .partial()
  .optional();

/**
 * Helpers to constrain manifest entries to known guide keys at runtime without losing type safety.
 */
const GUIDE_KEY_SET = new Set<GuideKey>(GUIDE_KEYS_WITH_OVERRIDES);
const guideKeySchema = z.custom<GuideKey>(
  (value) => typeof value === "string" && GUIDE_KEY_SET.has(value as GuideKey),
  {
    message: "Invalid guide key",
  },
);

export type GuideManifestEntry = {
  key: GuideKey;
  slug: string;
  contentKey: string;
  status: GuideStatus;
  /**
   * When true, the route should only be available under /{lang}/draft/* until promoted.
   */
  draftOnly?: boolean | undefined;
  draftPathSegment?: string;
  areas: GuideArea[];
  primaryArea: GuideArea;
  metaKey?: string;
  structuredData: StructuredDataDeclaration[];
  relatedGuides: GuideKey[];
  blocks: GuideBlockDeclaration[];
  options?: GuideRouteOptions;
  expectations?: GuideRouteExpectations;
  checklist?: GuideChecklistItem[];
  /**
   * Optional SEO/content auditing hints.
   * These are intentionally non-blocking fields that can be rolled out incrementally.
   */
  template?: GuideTemplate;
  focusKeyword?: string;
  primaryQuery?: string;
  timeSensitive?: boolean;
};

const GUIDE_MANIFEST_ENTRY_SCHEMA_BASE = z
  .object({
    key: guideKeySchema,
    slug: z.string().min(1),
    contentKey: z.string().min(1),
    status: z.enum(GUIDE_STATUS_VALUES).optional(),
    draftOnly: z.boolean().optional(),
    draftPathSegment: z.string().min(1).optional(),
    areas: z.array(z.enum(GUIDE_AREA_VALUES)).nonempty(),
    primaryArea: z.enum(GUIDE_AREA_VALUES),
    metaKey: z.string().min(1).optional(),
    structuredData: z.array(STRUCTURED_DATA_SCHEMA).optional(),
    relatedGuides: z.array(guideKeySchema).optional(),
    blocks: z.array(GUIDE_BLOCK_DECLARATION_SCHEMA).optional(),
    options: GUIDE_ROUTE_OPTIONS_SCHEMA,
    expectations: GUIDE_ROUTE_EXPECTATIONS_SCHEMA,
    checklist: z.array(CHECKLIST_ITEM_SCHEMA).optional(),
    template: z.enum(GUIDE_TEMPLATE_VALUES).optional(),
    focusKeyword: z.string().trim().min(3).optional(),
    primaryQuery: z.string().trim().min(3).optional(),
    timeSensitive: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    const ogType = value.options?.ogType?.trim();
    if (!ogType) return;
    if (hasArticleLikeStructuredData(value.structuredData)) {
      if (ogType.toLowerCase() !== "article") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options", "ogType"],
          message: 'Guides with article-like content must set og:type="article".',
        });
      }
    }
  });

export type GuideManifestEntryInput = z.input<typeof GUIDE_MANIFEST_ENTRY_SCHEMA_BASE>;

export const GUIDE_MANIFEST_ENTRY_SCHEMA: z.ZodEffects<
  typeof GUIDE_MANIFEST_ENTRY_SCHEMA_BASE,
  GuideManifestEntry
> = GUIDE_MANIFEST_ENTRY_SCHEMA_BASE.transform((value) => {
  const {
    draftPathSegment,
    metaKey,
    options,
    expectations,
    checklist,
    template,
    focusKeyword,
    primaryQuery,
    timeSensitive,
    ...rest
  } = value;
  const cleanOptions = options
    ? (Object.fromEntries(Object.entries(options).filter(([, v]) => typeof v !== "undefined")) as GuideRouteOptions)
    : undefined;
  const cleanExpectations = expectations
    ? (Object.fromEntries(Object.entries(expectations).filter(([, v]) => typeof v !== "undefined")) as GuideRouteExpectations)
    : undefined;
  const cleanChecklist = Array.isArray(checklist)
    ? checklist.map((item) => {
        const { note, ...rest } = item;
        return {
          ...rest,
          ...(typeof note === "string" ? { note } : {}),
        };
      })
    : undefined;
  return {
    ...rest,
    ...(typeof draftPathSegment === "string" ? { draftPathSegment } : {}),
    ...(typeof metaKey === "string" ? { metaKey } : {}),
    ...(typeof cleanOptions !== "undefined" ? { options: cleanOptions } : {}),
    ...(typeof cleanExpectations !== "undefined" ? { expectations: cleanExpectations } : {}),
    ...(Array.isArray(cleanChecklist) ? { checklist: cleanChecklist } : {}),
    ...(typeof template === "string" ? { template } : {}),
    ...(typeof focusKeyword === "string" ? { focusKeyword } : {}),
    ...(typeof primaryQuery === "string" ? { primaryQuery } : {}),
    ...(typeof timeSensitive === "boolean" ? { timeSensitive } : {}),
    status: (value.status ?? "draft") as GuideStatus,
    structuredData: value.structuredData ?? [],
    relatedGuides: value.relatedGuides ?? [],
    blocks: value.blocks ?? [],
  } satisfies GuideManifestEntry;
});

export function createGuideManifestEntry(input: GuideManifestEntryInput): GuideManifestEntry {
  return GUIDE_MANIFEST_ENTRY_SCHEMA.parse(input);
}

export type GuideManifest = Record<GuideKey, GuideManifestEntry>;

const manifestSeed: GuideManifestEntry[] = [
  // --- Assistance articles (converted from legacy help system) ---
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "rules",
    slug: "rules",
    contentKey: "rules",
    status: "draft",
    draftPathSegment: "assistance/rules",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "BreadcrumbList"],
    relatedGuides: ["security", "legal"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "rules", showToc: true },
      },
    ],
    options: {
      showTagChips: false,
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "ageAccessibility",
    slug: "age-accessibility",
    contentKey: "ageAccessibility",
    status: "draft",
    draftPathSegment: "assistance/age-accessibility",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "BreadcrumbList"],
    relatedGuides: ["bookingBasics", "checkinCheckout"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "ageAccessibility", showToc: true },
      },
    ],
    options: {
      showTagChips: false,
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "arrivingByFerry",
    slug: "arriving-by-ferry",
    contentKey: "arrivingByFerry",
    status: "draft",
    draftPathSegment: "assistance/arriving-by-ferry",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "BreadcrumbList"],
    relatedGuides: ["ferryDockToBrikette", "travelHelp", "naplesAirportBus"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "arrivingByFerry", showToc: true },
      },
    ],
    options: {
      showTagChips: false,
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "changingCancelling",
    slug: "changing-cancelling",
    contentKey: "changingCancelling",
    status: "draft",
    draftPathSegment: "assistance/changing-cancelling",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "BreadcrumbList"],
    relatedGuides: ["bookingBasics", "depositsPayments", "legal"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "changingCancelling", showToc: true },
      },
    ],
    options: {
      showTagChips: false,
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "checkinCheckout",
    slug: "checkin-checkout",
    contentKey: "checkinCheckout",
    status: "draft",
    draftPathSegment: "assistance/checkin-checkout",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "BreadcrumbList"],
    relatedGuides: ["rules", "security", "ageAccessibility"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "checkinCheckout", showToc: true },
      },
    ],
    options: {
      showTagChips: false,
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "defectsDamages",
    slug: "defects-damages",
    contentKey: "defectsDamages",
    status: "draft",
    draftPathSegment: "assistance/defects-damages",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "BreadcrumbList"],
    relatedGuides: ["rules", "security", "legal"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "defectsDamages", showToc: true },
      },
    ],
    options: {
      showTagChips: false,
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "depositsPayments",
    slug: "deposits-payments",
    contentKey: "depositsPayments",
    status: "draft",
    draftPathSegment: "assistance/deposits-payments",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "BreadcrumbList"],
    relatedGuides: ["bookingBasics", "changingCancelling", "legal"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "depositsPayments", showToc: true },
      },
    ],
    options: {
      showTagChips: false,
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "legal",
    slug: "legal",
    contentKey: "legal",
    status: "draft",
    draftPathSegment: "assistance/legal",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "BreadcrumbList"],
    relatedGuides: ["rules", "changingCancelling", "depositsPayments"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "legal", showToc: true },
      },
    ],
    options: {
      showTagChips: false,
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "naplesAirportBus",
    slug: "naples-airport-to-positano-bus",
    contentKey: "naplesAirportBus",
    status: "draft",
    draftPathSegment: "assistance/naples-airport-to-positano-bus",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "BreadcrumbList"],
    relatedGuides: ["arrivingByFerry", "travelHelp", "chiesaNuovaArrivals"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "naplesAirportBus", showToc: true },
      },
    ],
    options: {
      showTagChips: false,
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "security",
    slug: "security",
    contentKey: "security",
    status: "draft",
    draftPathSegment: "assistance/security",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "BreadcrumbList"],
    relatedGuides: ["rules", "checkinCheckout", "defectsDamages"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "security", showToc: true },
      },
    ],
    options: {
      showTagChips: false,
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "travelHelp",
    slug: "travel-help",
    contentKey: "travelHelp",
    status: "draft",
    draftPathSegment: "assistance/travel-help",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "BreadcrumbList"],
    relatedGuides: ["arrivingByFerry", "naplesAirportBus", "ferryDockToBrikette"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "travelHelp", showToc: true },
      },
    ],
    options: {
      showTagChips: false,
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "bookingBasics",
    slug: "booking-basics",
    contentKey: "bookingBasics",
    status: "draft",
    draftPathSegment: "assistance/booking-basics",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "BreadcrumbList"],
    relatedGuides: ["checkinCheckout", "depositsPayments", "changingCancelling", "rules"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "bookingBasics", showToc: true },
      },
    ],
    options: {
      showTagChips: false,
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "hostelFaqs",
    slug: "hostel-faqs",
    contentKey: "hostelFaqs",
    status: "draft",
    draftPathSegment: "assistance/hostel-faqs",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "FAQPage", "BreadcrumbList"],
    relatedGuides: ["checkinCheckout", "bookingBasics", "rules"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "hostelFaqs", showToc: true },
      },
    ],
    options: {
      suppressUnlocalizedFallback: false,
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
    ],
  }),
  // --- End assistance articles ---

  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "luggageStorage",
    slug: "luggage-storage-positano",
    contentKey: "luggageStorage",
    status: "draft",
    draftPathSegment: "guides/luggage-storage-positano",
    areas: ["help"],
    primaryArea: "help",
    structuredData: [
      "Article",
      {
        type: "Service",
        options: {
          source: "luggage-storage-positano.service",
        },
      },
      "BreadcrumbList",
    ],
    relatedGuides: ["porterServices", "ferryDockToBrikette", "chiesaNuovaArrivals"],
    blocks: [
      {
        type: "hero",
        options: {
          image: "luggage-storage-positano/hero.jpg",
        },
      },
      {
        type: "genericContent",
        options: {
          contentKey: "luggageStorage",
        },
      },
      {
        type: "faq",
        options: {
          fallbackKey: "luggageStorage",
        },
      },
      {
        type: "alsoHelpful",
        options: {
          tags: ["porters", "logistics", "positano"],
        },
      },
      {
        type: "serviceSchema",
        options: {
          source: "luggage-storage-positano.service",
        },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      showTransportNotice: false,
    },
    checklist: [
      { id: "translations", status: "inProgress", note: "Verify locale coverage beyond EN/IT." },
      { id: "jsonLd", status: "complete" },
      { id: "faqs", status: "complete" },
      { id: "content", status: "complete" },
      { id: "media", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "whatToPack",
    slug: "what-to-pack-amalfi-coast",
    contentKey: "whatToPack",
    status: "draft",
    draftPathSegment: "guides/what-to-pack-amalfi-coast",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article"],
    relatedGuides: ["pathOfTheGods", "sunsetViewpoints", "positanoBeaches"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "whatToPack", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "whatToPack", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["pathOfTheGods", "sunsetViewpoints", "positanoBeaches"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferManualWhenUnlocalized: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoWinterBudget",
    slug: "positano-in-winter-on-a-budget",
    contentKey: "positanoWinterBudget",
    status: "draft",
    draftPathSegment: "guides/positano-in-winter-on-a-budget",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["offSeasonLongStay", "workCafes", "positanoTravelGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoWinterBudget", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "positanoWinterBudget", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["offSeasonLongStay", "workCafes", "positanoTravelGuide"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "laundryPositano",
    slug: "laundry-positano",
    contentKey: "laundryPositano",
    status: "draft",
    draftPathSegment: "guides/laundry-positano",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "HowTo"],
    relatedGuides: ["porterServices", "ferryDockToBrikette", "groceriesPharmacies"],
    blocks: [],
    options: {
      showTagChips: true,
    },
    checklist: [
      { id: "translations", status: "inProgress", note: "Verify multi-locale copy for tips/how-to steps." },
      { id: "jsonLd", status: "inProgress", note: "Ensure HowTo schema mirrors localized steps." },
      { id: "faqs", status: "complete" },
      { id: "content", status: "complete" },
      { id: "media", status: "inProgress", note: "Confirm gallery assets for all locales." },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "limoncelloCuisine",
    slug: "limoncello-and-local-cuisine",
    contentKey: "limoncelloCuisine",
    status: "draft",
    draftPathSegment: "guides/limoncello-and-local-cuisine",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["cheapEats", "positanoTravelGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "limoncelloCuisine", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "limoncelloCuisine" },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferGenericWhenFallback: true,
    },
    checklist: [
      { id: "translations", status: "inProgress", note: "Localise cuisine descriptions and tasting tips." },
      { id: "jsonLd", status: "inProgress", note: "Review Article metadata for regional schema requirements." },
      { id: "faqs", status: "inProgress", note: "Ensure FAQ entries mirror updated tasting notes." },
      { id: "content", status: "complete" },
      { id: "media", status: "inProgress", note: "Confirm gallery photography rights." },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "pathOfTheGods",
    slug: "path-of-the-gods",
    contentKey: "pathOfTheGods",
    status: "draft",
    draftPathSegment: "guides/path-of-the-gods",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article", "HowTo"],
    relatedGuides: ["pathOfTheGodsFerry", "pathOfTheGodsBus", "pathOfTheGodsNocelle"],
    blocks: [],
    options: {
      showPlanChoice: false,
      showTransportNotice: false,
      showTagChips: true,
    },
    checklist: [
      { id: "translations", status: "inProgress", note: "Verify locale intros and essentials copy." },
      { id: "jsonLd", status: "inProgress", note: "Validate HowTo payload for totalTime extras." },
      { id: "faqs", status: "complete" },
      { id: "content", status: "complete" },
      { id: "media", status: "inProgress", note: "Confirm gallery imagery licensing." },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "pathOfTheGodsBus",
    slug: "path-of-the-gods-via-amalfi-bus",
    contentKey: "pathOfTheGodsBus",
    status: "draft",
    draftPathSegment: "guides/path-of-the-gods-via-amalfi-bus",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article", "HowTo"],
    relatedGuides: ["pathOfTheGods", "pathOfTheGodsFerry", "pathOfTheGodsNocelle"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "pathOfTheGodsBus", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "pathOfTheGodsBus", alwaysProvideFallback: true },
      },
    ],
    options: {
      showPlanChoice: false,
      showTransportNotice: false,
      showTagChips: true,
    },
    checklist: [
      { id: "translations", status: "inProgress", note: "Audit transport timings in all locales." },
      { id: "jsonLd", status: "inProgress", note: "Confirm HowTo schema reflects bus timings." },
      { id: "faqs", status: "complete" },
      { id: "content", status: "complete" },
      { id: "media", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "pathOfTheGodsFerry",
    slug: "path-of-the-gods-via-amalfi-ferry",
    contentKey: "pathOfTheGodsFerry",
    status: "draft",
    draftPathSegment: "guides/path-of-the-gods-via-amalfi-ferry",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article", "HowTo"],
    relatedGuides: ["pathOfTheGods", "pathOfTheGodsBus", "pathOfTheGodsNocelle"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "pathOfTheGodsFerry", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "pathOfTheGodsFerry", alwaysProvideFallback: true },
      },
    ],
    options: {
      showPlanChoice: false,
      showTransportNotice: false,
      showTagChips: true,
    },
    checklist: [
      { id: "translations", status: "inProgress", note: "Review ferry scheduling copy per locale." },
      { id: "jsonLd", status: "inProgress", note: "Ensure HowTo steps include ferry legs." },
      { id: "faqs", status: "complete" },
      { id: "content", status: "complete" },
      { id: "media", status: "missing", note: "Source imagery for ferry terminals." },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "simsAtms",
    slug: "sim-esim-and-atms-positano",
    contentKey: "simsAtms",
    status: "draft",
    draftPathSegment: "guides/sim-esim-and-atms-positano",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article"],
    relatedGuides: ["groceriesPharmacies", "whatToPack", "naplesPositano"],
    blocks: [],
    options: {
      showTagChips: true,
    },
    checklist: [
      { id: "translations", status: "inProgress", note: "Ensure fallback intro copy is localized where possible." },
      { id: "jsonLd", status: "inProgress", note: "Confirm FAQ fallback mirrors guidesFallback strings." },
      { id: "faqs", status: "complete" },
      { id: "content", status: "complete" },
      { id: "media", status: "missing", note: "Add imagery for SIM shops/ATMs." },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "freeThingsPositano",
    slug: "free-low-cost-things-to-do-positano",
    contentKey: "freeThingsPositano",
    status: "draft",
    draftPathSegment: "guides/free-low-cost-things-to-do-positano",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article"],
    relatedGuides: ["positanoBudget", "cheapEats", "positanoBeaches"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "freeThingsPositano" },
      },
      {
        type: "faq",
        options: { fallbackKey: "freeThingsPositano" },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoBudget", "cheapEats", "positanoBeaches"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
    checklist: [
      { id: "translations", status: "inProgress", note: "Localize free-activity highlights per locale." },
      { id: "jsonLd", status: "missing", note: "Add Article structured data for budget experiences." },
      { id: "faqs", status: "inProgress", note: "Ensure fallback FAQs match localized content." },
      { id: "content", status: "complete" },
      { id: "media", status: "missing", note: "Source imagery for featured free experiences." },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "couplesInHostels",
    slug: "traveling-as-a-couple-in-hostels",
    contentKey: "couplesInHostels",
    status: "draft",
    draftPathSegment: "guides/traveling-as-a-couple-in-hostels",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["onlyHostel", "positanoBudget"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "couplesInHostels" },
      },
      {
        type: "faq",
        options: {
          fallbackKey: "couplesInHostels",
          alwaysProvideFallback: true,
          suppressWhenUnlocalized: true,
        },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferManualWhenUnlocalized: true,
      suppressUnlocalizedFallback: true,
    },
    checklist: [
      { id: "translations", status: "inProgress", note: "Localize couple-focused hostel advice." },
      { id: "jsonLd", status: "missing", note: "Add Article structured data when ready." },
      { id: "faqs", status: "inProgress", note: "Ensure fallback FAQs align with localized content." },
      { id: "content", status: "inProgress", note: "Verify couple-friendly sections render as expected." },
      { id: "media", status: "missing", note: "Add imagery showcasing private hostel spaces for couples." },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "stayingFitAmalfi",
    slug: "staying-fit-while-traveling-amalfi-coast",
    contentKey: "stayingFitAmalfi",
    status: "draft",
    draftPathSegment: "guides/staying-fit-while-traveling-amalfi-coast",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["pathOfTheGods", "sunsetViewpoints", "positanoTravelGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "stayingFitAmalfi" },
      },
      {
        type: "faq",
        options: { fallbackKey: "stayingFitAmalfi", alwaysProvideFallback: true },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
    checklist: [
      { id: "translations", status: "inProgress", note: "Localize fitness and trail guidance per locale." },
      { id: "jsonLd", status: "missing", note: "Add Article structured data when finalized." },
      { id: "faqs", status: "inProgress", note: "Ensure fallback FAQs capture wellness tips." },
      { id: "content", status: "inProgress", note: "Verify workout sections render correctly." },
      { id: "media", status: "missing", note: "Add imagery for fitness routes if available." },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "naplesPositano",
    slug: "naples-to-positano",
    contentKey: "naplesPositano",
    status: "draft",
    draftPathSegment: "guides/naples-to-positano",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["ferrySchedules", "luggageStorage"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "naplesPositano" },
      },
      {
        type: "faq",
        options: { fallbackKey: "naplesPositano", alwaysProvideFallback: true },
      },
      {
        type: "alsoHelpful",
        options: {
          tags: ["transport", "naples", "positano", "ferry", "bus"],
          excludeGuide: ["ferrySchedules", "luggageStorage"],
          includeRooms: true,
        },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
    checklist: [
      { id: "translations", status: "inProgress", note: "Localize transport guidance across locales." },
      { id: "jsonLd", status: "missing", note: "Add Article structured data for transport advice." },
      { id: "faqs", status: "inProgress", note: "Ensure fallback FAQs cover route options." },
      { id: "content", status: "complete" },
      { id: "media", status: "missing", note: "Add gallery imagery for transit routes." },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "weekend48Positano",
    slug: "48-hour-positano-weekend",
    contentKey: "weekend48Positano",
    status: "draft",
    draftPathSegment: "guides/48-hour-positano-weekend",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["itinerariesPillar", "cheapEats", "positanoBeaches"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "weekend48Positano", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "weekend48Positano", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["itinerariesPillar", "cheapEats", "positanoBeaches"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "sevenDayNoCar",
    slug: "7-day-amalfi-coast-itinerary-no-car",
    contentKey: "sevenDayNoCar",
    status: "draft",
    draftPathSegment: "guides/7-day-amalfi-coast-itinerary-no-car",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["itinerariesPillar", "positanoTravelGuide", "dayTripsAmalfi"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "sevenDayNoCar", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "sevenDayNoCar", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["itinerariesPillar", "positanoTravelGuide", "dayTripsAmalfi"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      suppressUnlocalizedFallback: true,
      preferGenericWhenFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "capriDayTrip",
    slug: "day-trip-capri-from-positano",
    contentKey: "capriDayTrip",
    status: "draft",
    draftPathSegment: "guides/day-trip-capri-from-positano",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article", "HowTo", "FAQPage"],
    relatedGuides: ["ferrySchedules", "boatTours", "whatToPack"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "capriDayTrip", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "capriDayTrip", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["ferrySchedules", "boatTours", "whatToPack"] },
      },
      {
        type: "alsoHelpful",
        options: {
          tags: ["day-trip", "capri", "ferry", "positano"],
        },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      suppressUnlocalizedFallback: true,
    },
    checklist: [
      { id: "media", status: "inProgress", note: "Curate Capri gallery coverage before launch." },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "dayTripsAmalfi",
    slug: "day-trips-from-positano",
    contentKey: "dayTripsAmalfi",
    status: "draft",
    draftPathSegment: "guides/day-trips-from-positano",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["capriDayTrip", "positanoPompeii", "positanoAmalfi"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "dayTripsAmalfi", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "dayTripsAmalfi", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["capriDayTrip", "positanoPompeii", "positanoAmalfi"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      renderGenericWhenEmpty: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "itinerariesPillar",
    slug: "amalfi-coast-itineraries-no-car",
    contentKey: "itinerariesPillar",
    status: "draft",
    draftPathSegment: "guides/amalfi-coast-itineraries-no-car",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article", "HowTo", "FAQPage"],
    relatedGuides: ["weekend48Positano", "sevenDayNoCar", "dayTripsAmalfi"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "itinerariesPillar", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "itinerariesPillar", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["weekend48Positano", "sevenDayNoCar", "dayTripsAmalfi"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferManualWhenUnlocalized: true,
    },
    checklist: [
      { id: "translations", status: "inProgress", note: "Localize itinerary highlights per locale." },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "topViewpointsAmalfi",
    slug: "top-viewpoints-amalfi-coast",
    contentKey: "topViewpointsAmalfi",
    status: "draft",
    draftPathSegment: "guides/top-viewpoints-amalfi-coast",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["sunsetViewpoints", "instagramSpots", "positanoTravelGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "topViewpointsAmalfi", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "topViewpointsAmalfi", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["sunsetViewpoints", "instagramSpots", "positanoTravelGuide"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferManualWhenUnlocalized: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "santaMariaDelCastelloHike",
    slug: "santa-maria-del-castello-hike",
    contentKey: "santaMariaDelCastelloHike",
    status: "draft",
    draftPathSegment: "guides/santa-maria-del-castello-hike",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["topOfTheMountainHike", "pathOfTheGods", "sunriseHike"],
    blocks: [
      {
        type: "hero",
        options: {
          image: "santa-maria-castello/smaria-to-positano.jpg",
        },
      },
      {
        type: "genericContent",
        options: { contentKey: "santaMariaDelCastelloHike", showToc: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["topOfTheMountainHike", "pathOfTheGods", "sunriseHike"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "topOfTheMountainHike",
    slug: "top-of-the-mountain-hike",
    contentKey: "topOfTheMountainHike",
    status: "draft",
    draftPathSegment: "guides/top-of-the-mountain-hike",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["pathOfTheGods", "sunsetViewpoints", "stayingFitAmalfi"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "topOfTheMountainHike", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "topOfTheMountainHike", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["pathOfTheGods", "sunsetViewpoints", "stayingFitAmalfi"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      renderGenericWhenEmpty: true,
      suppressFaqWhenUnlocalized: true,
      fallbackToEnTocTitle: false,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "instagramSpots",
    slug: "positano-instagram-spots",
    contentKey: "instagramSpots",
    status: "draft",
    draftPathSegment: "guides/positano-instagram-spots",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["sunsetViewpoints", "positanoBeaches", "positanoTravelGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "instagramSpots", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "instagramSpots", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["sunsetViewpoints", "positanoBeaches", "positanoTravelGuide"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      renderGenericWhenEmpty: false,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "historyPositano",
    slug: "history-of-positano",
    contentKey: "historyPositano",
    status: "draft",
    draftPathSegment: "guides/history-of-positano",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["positanoTravelGuide", "instagramSpots", "scenicWalksPositano"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "historyPositano", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "historyPositano", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoTravelGuide", "instagramSpots", "scenicWalksPositano"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferGenericWhenFallback: true,
      ogType: "article",
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "ravelloGuide",
    slug: "ravello-travel-guide",
    contentKey: "ravelloGuide",
    status: "draft",
    draftPathSegment: "guides/ravello-travel-guide",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["ravelloFestival", "positanoRavello", "dayTripsAmalfi"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "ravelloGuide", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "ravelloGuide", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["ravelloFestival", "positanoRavello", "dayTripsAmalfi"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "fornilloBeachGuide",
    slug: "fornillo-beach-guide",
    contentKey: "fornilloBeachGuide",
    status: "draft",
    draftPathSegment: "guides/fornillo-beach-guide",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["hostelBriketteToFornilloBeach", "fornilloBeachToBrikette", "positanoBeaches"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "fornilloBeachGuide", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "fornilloBeachGuide", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["hostelBriketteToFornilloBeach", "fornilloBeachToBrikette", "positanoBeaches"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoBeaches",
    slug: "positano-beaches",
    contentKey: "positanoBeaches",
    status: "draft",
    draftPathSegment: "experiences/positano-beaches",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article", "ItemList"],
    focusKeyword: "Positano beaches",
    relatedGuides: ["fornilloBeachGuide", "positanoMainBeach", "gavitellaBeachGuide", "marinaDiPraiaBeaches"],
    blocks: [
      {
        type: "hero",
        options: {
          image: "/img/guides/positano-beaches/positano-main-beach.webp",
          alt: "Positano's main beach with colorful umbrellas and the town rising up the cliffs",
          showIntro: true,
        },
      },
      {
        type: "genericContent",
        options: { contentKey: "positanoBeaches", showToc: true },
      },
      {
        type: "table",
        options: {
          id: "beach-comparison",
          titleKey: "comparisonTable.title",
          columns: [
            { key: "beach", label: "Beach", align: "left" },
            { key: "price", label: "Lounger Prices", align: "left" },
            { key: "freeArea", label: "Free Area?", align: "center" },
            { key: "pros", label: "Pros", align: "left" },
            { key: "cons", label: "Cons", align: "left" },
          ],
          rows: [
            {
              beach: "Fornillo",
              price: "€15+ (Pupetto, Grassi, Ferdinando, La Marinella)",
              freeArea: "Yes",
              pros: "Cheaper; large free section; secret free area",
              cons: "Steep walk back; easier route via main beach & bus",
            },
            {
              beach: "Main (Grande)",
              price: "€25+ (L'Incanto); €100-400 (La Scogliera)",
              freeArea: "Yes",
              pros: "Classic Positano views; town backdrop",
              cons: "Most expensive; crowded",
            },
            {
              beach: "Arienzo",
              price: "€60+ with food/drink deals",
              freeArea: "Yes",
              pros: "Long sunshine; stunning views; good value packages",
              cons: "Hundreds of stairs; water taxi needed",
            },
            {
              beach: "Laurito",
              price: "Free with restaurant purchase (Da Adolfo); €30+ (Villa Tre Ville)",
              freeArea: "Yes",
              pros: "Extended sunshine; remarkable views",
              cons: "Da Adolfo overrated; small free area; water taxi needed",
            },
            {
              beach: "Gavitella (Praiano)",
              price: "Not listed",
              freeArea: "No",
              pros: "Ideal evening; sunset/aperitif atmosphere",
              cons: "Concrete jungle during day",
            },
            {
              beach: "Marina di Praia",
              price: "Not listed",
              freeArea: "Yes",
              pros: "Charming fishing cove",
              cons: "Narrow; limited morning sun",
            },
            {
              beach: "Fiordo di Furore",
              price: "Not listed",
              freeArea: "Yes",
              pros: "Instagram-worthy; cliff jumping; budget-friendly",
              cons: "Difficult access; extremely limited space",
            },
            {
              beach: "Regina Giovanna Bath (Sorrento)",
              price: "Free entry",
              freeArea: "Yes",
              pros: "Free natural pool; relatively unknown",
              cons: "No facilities",
            },
            {
              beach: "Amalfi Marina Grande",
              price: "Premium pricing (multiple clubs)",
              freeArea: "Varies",
              pros: "Multiple clubs; easy ferry/bus access",
              cons: "Premium pricing; book ahead in peak",
            },
          ],
        },
      },
      {
        type: "faq",
        options: { fallbackKey: "positanoBeaches", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["fornilloBeachGuide", "positanoMainBeach", "gavitellaBeachGuide", "marinaDiPraiaBeaches"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoMainBeach",
    slug: "positano-main-beach-guide",
    contentKey: "positanoMainBeach",
    status: "draft",
    draftPathSegment: "guides/positano-main-beach-guide",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    focusKeyword: "Spiaggia Grande Positano",
    relatedGuides: ["positanoBeaches", "fornilloBeachGuide", "positanoMainBeachBusDown"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoMainBeach", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "positanoMainBeach", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoBeaches", "fornilloBeachGuide", "positanoMainBeachBusDown"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "fiordoDiFuroreBeachGuide",
    slug: "fiordo-di-furore-beach-guide",
    contentKey: "fiordoDiFuroreBeachGuide",
    status: "draft",
    draftPathSegment: "guides/fiordo-di-furore-beach-guide",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["positanoBeaches", "marinaDiPraiaBeaches", "gavitellaBeachGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "fiordoDiFuroreBeachGuide", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "fiordoDiFuroreBeachGuide", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoBeaches", "marinaDiPraiaBeaches", "gavitellaBeachGuide"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferGenericWhenFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "ferrySchedules",
    slug: "ferry-schedules",
    contentKey: "ferrySchedules",
    status: "draft",
    draftPathSegment: "guides/ferry-schedules",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article"],
    relatedGuides: ["ferryCancellations", "chiesaNuovaArrivals", "chiesaNuovaDepartures", "ferryDockToBrikette"],
    blocks: [
      {
        type: "faq",
        options: { fallbackKey: "ferrySchedules", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["ferryCancellations", "chiesaNuovaArrivals", "chiesaNuovaDepartures", "ferryDockToBrikette"] },
      },
      {
        type: "alsoHelpful",
        options: {
          tags: ["transport", "ferry", "positano"],
          excludeGuide: ["ferryCancellations", "chiesaNuovaArrivals", "chiesaNuovaDepartures", "ferryDockToBrikette"],
          includeRooms: true,
        },
      },
    ],
    options: {
      showPlanChoice: false,
      showTransportNotice: true,
      renderGenericWhenEmpty: false,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "amalfiTownGuide",
    slug: "amalfi-town-guide",
    contentKey: "amalfiTownGuide",
    status: "draft",
    draftPathSegment: "guides/amalfi-town-guide",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article", "FAQPage"],
    relatedGuides: ["dayTripsAmalfi", "capriDayTrip", "positanoTravelGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "amalfiTownGuide", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "amalfiTownGuide", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["dayTripsAmalfi", "capriDayTrip", "positanoTravelGuide"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "avoidCrowdsPositano",
    slug: "avoid-crowds-off-the-beaten-path-positano",
    contentKey: "avoidCrowdsPositano",
    status: "draft",
    draftPathSegment: "guides/avoid-crowds-off-the-beaten-path-positano",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["topViewpointsAmalfi", "freeThingsPositano", "weekend48Positano"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "avoidCrowdsPositano", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "avoidCrowdsPositano", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["topViewpointsAmalfi", "freeThingsPositano", "weekend48Positano"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "cuisineAmalfiGuide",
    slug: "amalfi-coast-cuisine-guide",
    contentKey: "cuisineAmalfiGuide",
    status: "draft",
    draftPathSegment: "guides/amalfi-coast-cuisine-guide",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article", "FAQPage"],
    relatedGuides: ["cheapEats", "positanoDining", "limoncelloCuisine"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "cuisineAmalfiGuide", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "cuisineAmalfiGuide", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["cheapEats", "positanoDining", "limoncelloCuisine"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      showTransportNotice: false,
      showTocWhenUnlocalized: false,
    },
    checklist: [
      { id: "jsonLd", status: "inProgress", note: "Complete cuisine JSON-LD coverage." },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoDining",
    slug: "positano-dining-guide",
    contentKey: "positanoDining",
    status: "draft",
    draftPathSegment: "guides/positano-dining-guide",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article", "FAQPage"],
    relatedGuides: ["cheapEats", "cuisineAmalfiGuide", "freeThingsPositano"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoDining", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "positanoDining", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["cheapEats", "cuisineAmalfiGuide", "freeThingsPositano"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      renderGenericWhenEmpty: true,
      preferGenericWhenFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "cheapEats",
    slug: "cheap-eats-in-positano",
    contentKey: "cheapEats",
    status: "draft",
    draftPathSegment: "guides/cheap-eats-in-positano",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article", "FAQPage"],
    relatedGuides: ["positanoBudget", "groceriesPharmacies", "whatToPack"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "cheapEats", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "cheapEats", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoBudget", "groceriesPharmacies", "whatToPack"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "ferragostoPositano",
    slug: "ferragosto-in-positano",
    contentKey: "ferragostoPositano",
    status: "draft",
    draftPathSegment: "guides/ferragosto-in-positano",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["bestTimeToVisit", "sunsetViewpoints", "positanoBeaches"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "ferragostoPositano", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "ferragostoPositano", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["bestTimeToVisit", "sunsetViewpoints", "positanoBeaches"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "safetyAmalfi",
    slug: "staying-safe-positano-amalfi-coast",
    contentKey: "safetyAmalfi",
    status: "draft",
    draftPathSegment: "guides/staying-safe-positano-amalfi-coast",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "FAQPage"],
    relatedGuides: ["travelInsuranceAmalfi", "ecoFriendlyAmalfi", "petsAmalfi"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "safetyAmalfi", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "safetyAmalfi", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["travelInsuranceAmalfi", "ecoFriendlyAmalfi", "petsAmalfi"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: false,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "sitaTickets",
    slug: "sita-bus-tickets",
    contentKey: "sitaTickets",
    status: "draft",
    draftPathSegment: "guides/sita-bus-tickets",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "FAQPage"],
    relatedGuides: ["publicTransportAmalfi", "transportBudget", "howToGetToPositano"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "sitaTickets", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "sitaTickets", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["publicTransportAmalfi", "transportBudget", "howToGetToPositano"] },
      },
    ],
    options: {
      showTagChips: true,
      showTransportNotice: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "transportBudget",
    slug: "transport-on-a-budget-amalfi-coast",
    contentKey: "transportBudget",
    status: "draft",
    draftPathSegment: "guides/transport-on-a-budget-amalfi-coast",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article"],
    relatedGuides: ["reachBudget", "howToGetToPositano", "salernoVsNaplesArrivals"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "transportBudget", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "transportBudget", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["reachBudget", "howToGetToPositano", "salernoVsNaplesArrivals"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "publicTransportAmalfi",
    slug: "amalfi-coast-public-transport-guide",
    contentKey: "publicTransportAmalfi",
    status: "draft",
    draftPathSegment: "guides/amalfi-coast-public-transport-guide",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "FAQPage"],
    relatedGuides: ["transportBudget", "ferrySchedules", "sitaTickets"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "publicTransportAmalfi", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "publicTransportAmalfi", alwaysProvideFallback: true, preferManualWhenUnlocalized: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["transportBudget", "ferrySchedules", "sitaTickets"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      showTransportNotice: true,
      suppressUnlocalizedFallback: true,
      preferManualWhenUnlocalized: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "travelFaqsAmalfi",
    slug: "amalfi-coast-travel-faqs",
    contentKey: "travelFaqsAmalfi",
    status: "draft",
    draftPathSegment: "guides/amalfi-coast-travel-faqs",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "FAQPage"],
    relatedGuides: ["safetyAmalfi", "ecoFriendlyAmalfi", "transportBudget"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "travelFaqsAmalfi", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "travelFaqsAmalfi", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["safetyAmalfi", "ecoFriendlyAmalfi", "transportBudget"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "ecoFriendlyAmalfi",
    slug: "eco-friendly-travel-amalfi-coast",
    contentKey: "ecoFriendlyAmalfi",
    status: "draft",
    draftPathSegment: "guides/eco-friendly-travel-amalfi-coast",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "FAQPage"],
    relatedGuides: ["stayingFitAmalfi", "safetyAmalfi", "workAndTravelPositano"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "ecoFriendlyAmalfi", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "ecoFriendlyAmalfi", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["stayingFitAmalfi", "safetyAmalfi", "workAndTravelPositano"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "workAndTravelPositano",
    slug: "work-and-travel-remote-work-positano",
    contentKey: "workAndTravelPositano",
    status: "draft",
    draftPathSegment: "guides/work-and-travel-remote-work-positano",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article"],
    relatedGuides: ["workCafes", "workExchangeItaly", "ecoFriendlyAmalfi"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "workAndTravelPositano", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "workAndTravelPositano", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["workCafes", "workExchangeItaly", "ecoFriendlyAmalfi"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "workExchangeItaly",
    slug: "work-exchange-in-italian-hostels",
    contentKey: "workExchangeItaly",
    status: "draft",
    draftPathSegment: "guides/work-exchange-in-italian-hostels",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "FAQPage"],
    relatedGuides: ["workCafes", "workAndTravelPositano", "ecoFriendlyAmalfi"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "workExchangeItaly", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "workExchangeItaly", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["workCafes", "workAndTravelPositano", "ecoFriendlyAmalfi"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferManualWhenUnlocalized: true,
      suppressUnlocalizedFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "petsAmalfi",
    slug: "traveling-with-pets-amalfi-coast",
    contentKey: "petsAmalfi",
    status: "draft",
    draftPathSegment: "guides/traveling-with-pets-amalfi-coast",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "FAQPage"],
    relatedGuides: ["ecoFriendlyAmalfi", "safetyAmalfi", "workAndTravelPositano"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "petsAmalfi", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "petsAmalfi", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["ecoFriendlyAmalfi", "safetyAmalfi", "workAndTravelPositano"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      showRelatedWhenLocalized: false,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "bestTimeToVisit",
    slug: "best-time-to-visit-positano",
    contentKey: "bestTimeToVisit",
    status: "draft",
    draftPathSegment: "guides/best-time-to-visit-positano",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "FAQPage"],
    relatedGuides: ["positanoTravelGuide", "transportBudget", "ecoFriendlyAmalfi"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "bestTimeToVisit", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "bestTimeToVisit", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoTravelGuide", "transportBudget", "ecoFriendlyAmalfi"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "parking",
    slug: "positano-parking",
    contentKey: "parking",
    status: "draft",
    draftPathSegment: "guides/positano-parking",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "FAQPage"],
    relatedGuides: ["drivingAmalfi", "transportBudget", "publicTransportAmalfi"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "parking", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "parking", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["drivingAmalfi", "transportBudget", "publicTransportAmalfi"] },
      },
    ],
    options: {
      showTagChips: true,
      showTransportNotice: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "salernoPositano",
    slug: "salerno-to-positano",
    contentKey: "salernoPositano",
    status: "draft",
    draftPathSegment: "guides/salerno-to-positano",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["ferrySchedules", "reachBudget", "luggageStorage"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "salernoPositano", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "salernoPositano", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["ferrySchedules", "reachBudget", "luggageStorage"] },
      },
      {
        type: "alsoHelpful",
        options: {
          tags: ["transport", "salerno", "positano", "ferry", "bus"],
          excludeGuide: ["ferrySchedules", "reachBudget", "luggageStorage"],
          includeRooms: true,
        },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "interrailAmalfi",
    slug: "interrail-italy-rail-pass-amalfi-coast",
    contentKey: "interrailAmalfi",
    status: "draft",
    draftPathSegment: "guides/interrail-italy-rail-pass-amalfi-coast",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article"],
    relatedGuides: ["howToGetToPositano", "transportBudget", "salernoPositano"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "interrailAmalfi", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "interrailAmalfi", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["howToGetToPositano", "transportBudget", "salernoPositano"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "naplesCityGuide",
    slug: "naples-city-guide-for-amalfi-travelers",
    contentKey: "naplesCityGuide",
    status: "draft",
    draftPathSegment: "guides/naples-city-guide-for-amalfi-travelers",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article"],
    relatedGuides: ["reachBudget", "foodieGuideNaplesAmalfi"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "naplesCityGuide", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "naplesCityGuide", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["reachBudget", "foodieGuideNaplesAmalfi"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "backpackingSouthernItaly",
    slug: "backpacking-southern-italy-itinerary",
    contentKey: "backpackingSouthernItaly",
    status: "draft",
    draftPathSegment: "guides/backpacking-southern-italy-itinerary",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["sevenDayNoCar", "interrailAmalfi", "positanoTravelGuide"],
    blocks: [
      {
        type: "faq",
        options: { fallbackKey: "backpackingSouthernItaly", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["sevenDayNoCar", "interrailAmalfi", "positanoTravelGuide"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "hitchhikingAmalfi",
    slug: "hitchhiking-the-amalfi-coast",
    contentKey: "hitchhikingAmalfi",
    status: "draft",
    draftPathSegment: "guides/hitchhiking-the-amalfi-coast",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article"],
    relatedGuides: ["transportBudget", "positanoAmalfi", "positanoTravelGuide"],
    blocks: [
      {
        type: "genericContent",
        options: {
          contentKey: "hitchhikingAmalfi",
          showToc: true,
          renderWhenEmpty: true,
        },
      },
      {
        type: "faq",
        options: { fallbackKey: "hitchhikingAmalfi", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["transportBudget", "positanoAmalfi", "positanoTravelGuide"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferGenericWhenFallback: true,
      renderGenericWhenEmpty: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "offbeatVillagesAmalfi",
    slug: "offbeat-amalfi-coast-villages",
    contentKey: "offbeatVillagesAmalfi",
    status: "draft",
    draftPathSegment: "guides/offbeat-amalfi-coast-villages",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["dayTripsAmalfi", "transportBudget", "topViewpointsAmalfi"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "offbeatVillagesAmalfi", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "offbeatVillagesAmalfi", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["dayTripsAmalfi", "transportBudget", "topViewpointsAmalfi"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferManualWhenUnlocalized: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "praianoGuide",
    slug: "praiano-travel-guide",
    contentKey: "praianoGuide",
    status: "draft",
    draftPathSegment: "guides/praiano-travel-guide",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["marinaDiPraiaBeaches", "topViewpointsAmalfi", "scenicWalksPositano"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "praianoGuide", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "praianoGuide", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["marinaDiPraiaBeaches", "topViewpointsAmalfi", "scenicWalksPositano"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "salernoGatewayGuide",
    slug: "salerno-amalfi-coast-gateway",
    contentKey: "salernoGatewayGuide",
    status: "draft",
    draftPathSegment: "guides/salerno-amalfi-coast-gateway",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article"],
    relatedGuides: ["salernoVsNaplesArrivals", "salernoPositano", "ferrySchedules"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "salernoGatewayGuide", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "salernoGatewayGuide", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["salernoVsNaplesArrivals", "salernoPositano", "ferrySchedules"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      showTocWhenUnlocalized: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoMainBeachWalkDown",
    slug: "walk-down-to-positano-main-beach",
    contentKey: "positanoMainBeachWalkDown",
    status: "draft",
    draftPathSegment: "guides/walk-down-to-positano-main-beach",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["positanoMainBeachBusDown", "positanoMainBeachBusBack", "positanoBeaches"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoMainBeachWalkDown", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "positanoMainBeachWalkDown", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoMainBeachBusDown", "positanoMainBeachBusBack", "positanoBeaches"] },
      },
      {
        type: "alsoHelpful",
        options: {
          tags: ["beaches", "positano", "bus"],
          excludeGuide: ["positanoMainBeachBusDown", "positanoMainBeachBusBack", "positanoBeaches"],
          includeRooms: true,
        },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoMainBeachWalkBack",
    slug: "walk-back-to-hostel-brikette-from-positano-main-beach",
    contentKey: "positanoMainBeachWalkBack",
    status: "draft",
    draftPathSegment: "guides/walk-back-to-hostel-brikette-from-positano-main-beach",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["positanoMainBeachWalkDown", "positanoMainBeachBusBack", "positanoBeaches"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoMainBeachWalkBack", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "positanoMainBeachWalkBack", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoMainBeachWalkDown", "positanoMainBeachBusBack", "positanoBeaches"] },
      },
      {
        type: "alsoHelpful",
        options: {
          tags: ["beaches", "positano", "stairs"],
          excludeGuide: ["positanoMainBeachWalkDown", "positanoMainBeachBusBack", "positanoBeaches"],
          includeRooms: true,
        },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoMainBeachBusDown",
    slug: "bus-down-to-positano-main-beach",
    contentKey: "positanoMainBeachBusDown",
    status: "draft",
    draftPathSegment: "guides/bus-down-to-positano-main-beach",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["positanoMainBeachWalkDown", "positanoMainBeachBusBack", "positanoBeaches"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoMainBeachBusDown", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "positanoMainBeachBusDown", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoMainBeachWalkDown", "positanoMainBeachBusBack", "positanoBeaches"] },
      },
      {
        type: "alsoHelpful",
        options: {
          tags: ["beaches", "positano", "bus"],
          excludeGuide: ["positanoMainBeachWalkDown", "positanoMainBeachBusBack", "positanoBeaches"],
          includeRooms: true,
        },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoMainBeachBusBack",
    slug: "bus-back-to-hostel-brikette-from-positano-main-beach",
    contentKey: "positanoMainBeachBusBack",
    status: "draft",
    draftPathSegment: "guides/bus-back-to-hostel-brikette-from-positano-main-beach",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["positanoMainBeachBusDown", "positanoMainBeachWalkBack", "positanoBeaches"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoMainBeachBusBack", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "positanoMainBeachBusBack", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoMainBeachBusDown", "positanoMainBeachWalkBack", "positanoBeaches"] },
      },
      {
        type: "alsoHelpful",
        options: {
          tags: ["beaches", "positano", "bus"],
          excludeGuide: ["positanoMainBeachBusDown", "positanoMainBeachBusBack", "positanoBeaches"],
          includeRooms: true,
        },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "drivingAmalfi",
    slug: "driving-the-amalfi-coast-tips",
    contentKey: "drivingAmalfi",
    status: "draft",
    draftPathSegment: "guides/driving-the-amalfi-coast-tips",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article"],
    relatedGuides: ["transportBudget", "publicTransportAmalfi", "salernoPositano"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "drivingAmalfi", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "drivingAmalfi", alwaysProvideFallback: true },
      },
      {
        type: "alsoHelpful",
        options: { tags: ["transport", "car", "positano", "planning"], includeRooms: true },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "scooterRentalPositano",
    slug: "scooter-rental-positano-guide",
    contentKey: "scooterRentalPositano",
    status: "draft",
    draftPathSegment: "guides/scooter-rental-positano-guide",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article", "FAQPage", "BreadcrumbList"],
    relatedGuides: ["drivingAmalfi", "publicTransportAmalfi", "transportBudget"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "scooterRentalPositano" },
      },
      {
        type: "faq",
        options: { fallbackKey: "scooterRentalPositano", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["drivingAmalfi", "publicTransportAmalfi", "transportBudget"] },
      },
    ],
    options: {
      showPlanChoice: false,
      showTransportNotice: false,
      showTagChips: false,
      showRelatedWhenLocalized: false,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "souvenirsAmalfi",
    slug: "thrifty-souvenir-shopping-amalfi-coast",
    contentKey: "souvenirsAmalfi",
    status: "draft",
    draftPathSegment: "guides/thrifty-souvenir-shopping-amalfi-coast",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["limoncelloCuisine", "cheapEats", "positanoTravelGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "souvenirsAmalfi" },
      },
      {
        type: "faq",
        options: { fallbackKey: "souvenirsAmalfi", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["limoncelloCuisine", "cheapEats", "positanoTravelGuide"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferManualWhenUnlocalized: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "soloTravelPositano",
    slug: "solo-travel-positano-tips",
    contentKey: "soloTravelPositano",
    status: "draft",
    draftPathSegment: "guides/solo-travel-positano-tips",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article"],
    relatedGuides: ["ravelloFestival", "dayTripsAmalfi", "instagramSpots"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "soloTravelPositano", showToc: false },
      },
      {
        type: "faq",
        options: { fallbackKey: "soloTravelPositano", alwaysProvideFallback: true },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      showTocWhenUnlocalized: false,
      showTransportNotice: false,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "travelInsuranceAmalfi",
    slug: "travel-insurance-amalfi-coast",
    contentKey: "travelInsuranceAmalfi",
    status: "draft",
    draftPathSegment: "guides/travel-insurance-amalfi-coast",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article"],
    relatedGuides: ["pathOfTheGods", "positanoTravelGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "travelInsuranceAmalfi" },
      },
      {
        type: "faq",
        options: { fallbackKey: "travelInsuranceAmalfi" },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      renderGenericWhenEmpty: true,
      suppressUnlocalizedFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "italianPhrasesCampania",
    slug: "italian-phrases-for-travelers-campania",
    contentKey: "italianPhrasesCampania",
    status: "draft",
    draftPathSegment: "guides/italian-phrases-for-travelers-campania",
    areas: ["help"],
    primaryArea: "help",
    structuredData: ["Article"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "italianPhrasesCampania", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "italianPhrasesCampania", alwaysProvideFallback: true },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferGenericWhenFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "folkloreAmalfi",
    slug: "local-legends-and-folklore-amalfi-coast",
    contentKey: "folkloreAmalfi",
    status: "draft",
    draftPathSegment: "guides/local-legends-and-folklore-amalfi-coast",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["luminariaPraiano", "ravelloFestival", "ferragostoPositano"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "folkloreAmalfi", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "folkloreAmalfi", alwaysProvideFallback: true },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferManualWhenUnlocalized: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "foodieGuideNaplesAmalfi",
    slug: "foodies-guide-naples-amalfi",
    contentKey: "foodieGuideNaplesAmalfi",
    status: "draft",
    draftPathSegment: "guides/foodies-guide-naples-amalfi",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["cheapEats", "limoncelloCuisine", "naplesCityGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "foodieGuideNaplesAmalfi", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "foodieGuideNaplesAmalfi", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["cheapEats", "limoncelloCuisine", "naplesCityGuide"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "cookingClassesAmalfi",
    slug: "cooking-classes-amalfi-coast",
    contentKey: "cookingClassesAmalfi",
    status: "draft",
    draftPathSegment: "guides/cooking-classes-amalfi-coast",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["cuisineAmalfiGuide", "limoncelloCuisine", "foodieGuideNaplesAmalfi"],
    blocks: [
      {
        type: "faq",
        options: { fallbackKey: "cookingClassesAmalfi", alwaysProvideFallback: true },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferManualWhenUnlocalized: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "sunriseHike",
    slug: "sunrise-hike-positano",
    contentKey: "sunriseHike",
    status: "draft",
    draftPathSegment: "guides/sunrise-hike-positano",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["topOfTheMountainHike", "sunsetViewpoints", "pathOfTheGods"],
    blocks: [
      {
        type: "faq",
        options: { fallbackKey: "sunriseHike", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["topOfTheMountainHike", "sunsetViewpoints", "pathOfTheGods"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      renderGenericWhenEmpty: false,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "gavitellaBeachGuide",
    slug: "gavitella-beach-guide",
    contentKey: "gavitellaBeachGuide",
    status: "draft",
    focusKeyword: "Gavitella Beach Praiano",
    draftPathSegment: "guides/gavitella-beach-guide",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["positanoBeaches", "marinaDiPraiaBeaches", "boatTours"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "gavitellaBeachGuide", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "gavitellaBeachGuide", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoBeaches", "marinaDiPraiaBeaches", "boatTours"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "lauritoBeachBusBack",
    slug: "bus-back-from-laurito-beach",
    contentKey: "lauritoBeachBusBack",
    status: "draft",
    draftPathSegment: "guides/bus-back-from-laurito-beach",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["lauritoBeachGuide", "lauritoBeachBusDown", "positanoBeaches"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "lauritoBeachBusBack", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "lauritoBeachBusBack", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["lauritoBeachGuide", "lauritoBeachBusDown", "positanoBeaches"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "lauritoBeachBusDown",
    slug: "bus-down-to-positano-main-beach",
    contentKey: "lauritoBeachBusDown",
    status: "draft",
    draftPathSegment: "guides/bus-down-to-positano-main-beach",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["lauritoBeachBusBack", "positanoBeaches", "positanoMainBeachWalkDown"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "lauritoBeachBusDown", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "lauritoBeachBusDown", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["lauritoBeachBusBack", "positanoBeaches", "positanoMainBeachWalkDown"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "lauritoBeachGuide",
    slug: "laurito-beach-guide",
    contentKey: "lauritoBeachGuide",
    focusKeyword: "Laurito Beach",
    status: "draft",
    draftPathSegment: "guides/laurito-beach-guide",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["lauritoBeachBusDown", "lauritoBeachBusBack", "positanoBeaches"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "lauritoBeachGuide", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "lauritoBeachGuide", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["lauritoBeachBusDown", "lauritoBeachBusBack", "positanoBeaches"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "arienzoBeachBusBack",
    slug: "bus-back-from-arienzo-beach",
    contentKey: "arienzoBeachBusBack",
    status: "draft",
    draftPathSegment: "guides/bus-back-from-arienzo-beach",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["arienzoBeachClub", "hostelBriketteToArienzoBus", "positanoBeaches"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "arienzoBeachBusBack", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "arienzoBeachBusBack", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["arienzoBeachClub", "hostelBriketteToArienzoBus", "positanoBeaches"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "artisansPositanoShopping",
    slug: "art-and-artisans-positano-shopping",
    contentKey: "artisansPositanoShopping",
    status: "draft",
    draftPathSegment: "guides/art-and-artisans-positano-shopping",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["souvenirsAmalfi", "naplesCityGuide", "foodieGuideNaplesAmalfi"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "artisansPositanoShopping", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "artisansPositanoShopping", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["souvenirsAmalfi", "naplesCityGuide", "foodieGuideNaplesAmalfi"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "budgetAccommodationBeyond",
    slug: "budget-accommodation-beyond-positano",
    contentKey: "budgetAccommodationBeyond",
    status: "draft",
    draftPathSegment: "guides/budget-accommodation-beyond-positano",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["positanoBudget", "transportBudget", "howToGetToPositano"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "budgetAccommodationBeyond", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "budgetAccommodationBeyond", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoBudget", "transportBudget", "howToGetToPositano"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "ischiaProcidaGuide",
    slug: "ischia-and-procida-guide",
    contentKey: "ischiaProcidaGuide",
    status: "draft",
    draftPathSegment: "guides/ischia-and-procida-guide",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["capriDayTrip", "dayTripsAmalfi", "naplesCityGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "ischiaProcidaGuide", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "ischiaProcidaGuide", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["capriDayTrip", "dayTripsAmalfi", "naplesCityGuide"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferGenericWhenFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "etiquetteItalyAmalfi",
    slug: "italy-travel-etiquette-amalfi-examples",
    contentKey: "etiquetteItalyAmalfi",
    status: "draft",
    draftPathSegment: "guides/italy-travel-etiquette-amalfi-examples",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["travelTipsFirstTime", "avoidCrowdsPositano", "cuisineAmalfiGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "etiquetteItalyAmalfi", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "etiquetteItalyAmalfi", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["travelTipsFirstTime", "avoidCrowdsPositano", "cuisineAmalfiGuide"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      renderGenericWhenEmpty: true,
      showTocWhenUnlocalized: false,
      preferGenericWhenFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "scenicWalksPositano",
    slug: "scenic-walks-positano-environs",
    contentKey: "scenicWalksPositano",
    status: "draft",
    draftPathSegment: "guides/scenic-walks-positano-environs",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["walkingTourAudio", "pathOfTheGods", "instagramSpots"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "scenicWalksPositano", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "scenicWalksPositano" },
      },
      {
        type: "relatedGuides",
        options: { guides: ["walkingTourAudio", "pathOfTheGods", "instagramSpots"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferGenericWhenFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "campingAmalfi",
    slug: "camping-on-the-amalfi-coast",
    contentKey: "campingAmalfi",
    status: "draft",
    draftPathSegment: "guides/camping-on-the-amalfi-coast",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["transportBudget", "positanoTravelGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "campingAmalfi", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "campingAmalfi", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["transportBudget", "positanoTravelGuide"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferGenericWhenFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "capriOnABudget",
    slug: "capri-on-a-budget",
    contentKey: "capriOnABudget",
    status: "draft",
    draftPathSegment: "guides/capri-on-a-budget",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["capriDayTrip", "transportBudget", "cheapEats"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "capriOnABudget", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "capriOnABudget", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["capriDayTrip", "transportBudget", "cheapEats"] },
      },
      {
        type: "alsoHelpful",
        options: {
          tags: ["budgeting", "capri", "day-trip", "ferry", "positano"],
          excludeGuide: ["capriDayTrip", "transportBudget", "cheapEats"],
          includeRooms: true,
        },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferGenericWhenFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "reginaGiovannaBath",
    slug: "regina-giovanna-bath-beach-guide",
    contentKey: "reginaGiovannaBath",
    focusKeyword: "Bagni della Regina Giovanna",
    status: "draft",
    draftPathSegment: "guides/regina-giovanna-bath-beach-guide",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["positanoBeaches", "naplesCityGuide", "dayTripsAmalfi"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "reginaGiovannaBath", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "reginaGiovannaBath", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoBeaches", "naplesCityGuide", "dayTripsAmalfi"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferGenericWhenFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "tramontiWineries",
    slug: "tramonti-wineries-amalfi-coast",
    contentKey: "tramontiWineries",
    status: "draft",
    draftPathSegment: "guides/tramonti-wineries-amalfi-coast",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["foodieGuideNaplesAmalfi", "offbeatVillagesAmalfi", "salernoGatewayGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "tramontiWineries", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "tramontiWineries", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["foodieGuideNaplesAmalfi", "offbeatVillagesAmalfi", "salernoGatewayGuide"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferManualWhenUnlocalized: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "photographyGuidePositano",
    slug: "positano-photography-guide-best-spots",
    contentKey: "photographyGuidePositano",
    status: "draft",
    draftPathSegment: "guides/positano-photography-guide-best-spots",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["instagramSpots", "topViewpointsAmalfi", "sunsetViewpoints"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "photographyGuidePositano", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "photographyGuidePositano", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["instagramSpots", "topViewpointsAmalfi", "sunsetViewpoints"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferGenericWhenFallback: true,
      showRelatedWhenLocalized: false,
      showTocWhenUnlocalized: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "boatTours",
    slug: "boat-tours-positano",
    contentKey: "boatTours",
    status: "draft",
    draftPathSegment: "guides/boat-tours-positano",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["ferrySchedules", "capriDayTrip", "sunsetViewpoints"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "boatTours", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "boatTours", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["ferrySchedules", "capriDayTrip", "sunsetViewpoints"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferGenericWhenFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "hostelBriketteToArienzoBus",
    slug: "bus-to-arienzo-beach",
    contentKey: "hostelBriketteToArienzoBus",
    status: "draft",
    draftPathSegment: "guides/bus-to-arienzo-beach",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["positanoBeaches", "lauritoBeachBusBack", "positanoMainBeachBusDown"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "hostelBriketteToArienzoBus", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "hostelBriketteToArienzoBus", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoBeaches", "lauritoBeachBusBack", "positanoMainBeachBusDown"] },
      },
      {
        type: "alsoHelpful",
        options: {
          tags: ["beaches", "positano", "bus"],
          excludeGuide: ["positanoBeaches", "lauritoBeachBusBack", "positanoMainBeachBusDown"],
          includeRooms: true,
        },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "pathOfTheGodsNocelle",
    slug: "path-of-the-gods-via-nocelle",
    contentKey: "pathOfTheGodsNocelle",
    status: "draft",
    draftPathSegment: "guides/path-of-the-gods-via-nocelle",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article", "HowTo"],
    relatedGuides: ["pathOfTheGods", "pathOfTheGodsFerry", "pathOfTheGodsBus"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "pathOfTheGodsNocelle", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "pathOfTheGodsNocelle", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["pathOfTheGods", "pathOfTheGodsFerry", "pathOfTheGodsBus"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: false,
      showTransportNotice: false,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "marinaDiPraiaBeaches",
    slug: "marina-di-praia-and-secluded-beaches",
    contentKey: "marinaDiPraiaBeaches",
    status: "draft",
    draftPathSegment: "guides/marina-di-praia-and-secluded-beaches",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["praianoGuide", "beachHoppingAmalfi", "positanoBeaches"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "marinaDiPraiaBeaches", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "marinaDiPraiaBeaches", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["praianoGuide", "beachHoppingAmalfi", "positanoBeaches"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "beachHoppingAmalfi",
    slug: "beach-hopping-amalfi-coast",
    contentKey: "beachHoppingAmalfi",
    status: "draft",
    draftPathSegment: "guides/beach-hopping-amalfi-coast",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["praianoGuide", "positanoBeaches", "positanoTravelGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "beachHoppingAmalfi", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "beachHoppingAmalfi", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["praianoGuide", "positanoBeaches", "positanoTravelGuide"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "hostelBriketteToFiordoDiFuroreBus",
    slug: "hostel-brikette-to-fiordo-di-furore-by-bus",
    contentKey: "hostelBriketteToFiordoDiFuroreBus",
    status: "draft",
    draftPathSegment: "guides/hostel-brikette-to-fiordo-di-furore-by-bus",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["fiordoDiFuroreBeachGuide", "fiordoDiFuroreBusReturn", "positanoBeaches"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "hostelBriketteToFiordoDiFuroreBus", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "hostelBriketteToFiordoDiFuroreBus", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["fiordoDiFuroreBeachGuide", "fiordoDiFuroreBusReturn", "positanoBeaches"] },
      },
      {
        type: "alsoHelpful",
        options: {
          tags: ["beaches", "bus", "positano"],
          excludeGuide: ["fiordoDiFuroreBeachGuide", "fiordoDiFuroreBusReturn", "positanoBeaches"],
          includeRooms: true,
        },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "hostelBriketteToFornilloBeach",
    slug: "hostel-brikette-to-fornillo-beach",
    contentKey: "hostelBriketteToFornilloBeach",
    status: "draft",
    draftPathSegment: "guides/hostel-brikette-to-fornillo-beach",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["positanoBeaches", "beachHoppingAmalfi", "positanoTravelGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "hostelBriketteToFornilloBeach", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "hostelBriketteToFornilloBeach", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoBeaches", "beachHoppingAmalfi", "positanoTravelGuide"] },
      },
      {
        type: "alsoHelpful",
        options: {
          tags: ["beaches", "positano", "stairs"],
          excludeGuide: ["positanoBeaches", "beachHoppingAmalfi", "positanoTravelGuide"],
          includeRooms: true,
        },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "hostelBriketteToReginaGiovannaBath",
    slug: "hostel-brikette-to-regina-giovanna-bath",
    contentKey: "hostelBriketteToReginaGiovannaBath",
    status: "draft",
    draftPathSegment: "guides/hostel-brikette-to-regina-giovanna-bath",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["reginaGiovannaBath", "naplesCityGuide", "dayTripsAmalfi"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "hostelBriketteToReginaGiovannaBath", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "hostelBriketteToReginaGiovannaBath", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["reginaGiovannaBath", "naplesCityGuide", "dayTripsAmalfi"] },
      },
      {
        type: "alsoHelpful",
        options: {
          tags: ["beaches", "transport", "sorrento"],
          excludeGuide: ["reginaGiovannaBath", "hostelBriketteToReginaGiovannaBath"],
          includeRooms: false,
        },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "arienzoBeachClub",
    slug: "arienzo-beach-guide",
    contentKey: "arienzoBeachClub",
    status: "draft",
    draftPathSegment: "guides/arienzo-beach-guide",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["positanoBeaches", "fornilloBeachGuide", "boatTours"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "arienzoBeachClub", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "arienzoBeachClub", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["positanoBeaches", "fornilloBeachGuide", "boatTours"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "limoncelloFactory",
    slug: "inside-a-limoncello-factory-amalfi-coast",
    contentKey: "limoncelloFactory",
    status: "draft",
    draftPathSegment: "guides/inside-a-limoncello-factory-amalfi-coast",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["limoncelloCuisine", "cuisineAmalfiGuide", "tramontiWineries"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "limoncelloFactory", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "limoncelloFactory", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["limoncelloCuisine", "cuisineAmalfiGuide", "tramontiWineries"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      suppressUnlocalizedFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "walkingTourAudio",
    slug: "free-walking-tour-audio-positano",
    contentKey: "walkingTourAudio",
    status: "draft",
    draftPathSegment: "guides/free-walking-tour-audio-positano",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["sunsetViewpoints", "positanoBeaches", "positanoTravelGuide"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "walkingTourAudio", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "walkingTourAudio", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["sunsetViewpoints", "positanoBeaches", "positanoTravelGuide"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferGenericWhenFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "groceriesPharmacies",
    slug: "groceries-and-pharmacies-positano",
    contentKey: "groceriesPharmacies",
    status: "draft",
    draftPathSegment: "guides/groceries-and-pharmacies-positano",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: ["simsAtms", "whatToPack", "positanoBeaches"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "groceriesPharmacies", showToc: true },
      },
      {
        type: "faq",
        options: { fallbackKey: "groceriesPharmacies", alwaysProvideFallback: true },
      },
      {
        type: "relatedGuides",
        options: { guides: ["simsAtms", "whatToPack", "positanoBeaches"] },
      },
    ],
    options: {
      showTagChips: true,
      showPlanChoice: true,
      preferManualWhenUnlocalized: true,
      suppressUnlocalizedFallback: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "ferryDockToBrikette",
    slug: "ferry-dock-to-hostel-brikette-with-luggage",
    contentKey: "ferryDockToBrikette",
    status: "draft",
    draftPathSegment: "guides/ferry-dock-to-hostel-brikette-with-luggage",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["BreadcrumbList"],
    relatedGuides: [],
    blocks: [],
    expectations: {
      redirectOnly: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "briketteToFerryDock",
    slug: "hostel-brikette-to-ferry-dock-with-luggage",
    contentKey: "briketteToFerryDock",
    status: "draft",
    draftPathSegment: "guides/hostel-brikette-to-ferry-dock-with-luggage",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["Article", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [],
    expectations: {
      redirectOnly: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "chiesaNuovaArrivals",
    slug: "chiesa-nuova-bar-internazionale-to-hostel-brikette",
    contentKey: "chiesaNuovaArrivals",
    status: "draft",
    draftPathSegment: "guides/chiesa-nuova-bar-internazionale-to-hostel-brikette",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["BreadcrumbList"],
    relatedGuides: [],
    blocks: [],
    expectations: {
      redirectOnly: true,
    },
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "chiesaNuovaDepartures",
    slug: "hostel-brikette-to-chiesa-nuova-bar-internazionale",
    contentKey: "chiesaNuovaDepartures",
    status: "draft",
    draftPathSegment: "guides/hostel-brikette-to-chiesa-nuova-bar-internazionale",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["BreadcrumbList"],
    relatedGuides: [],
    blocks: [],
    expectations: {
      redirectOnly: true,
    },
  }),
  // --- Transport routes (pilot migration from legacy how-to-get-here system) ---
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "amalfiPositanoFerry",
    slug: "amalfi-positano-ferry",
    contentKey: "amalfiPositanoFerry",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: ["ferryDockToBrikette"],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "amalfiPositanoFerry", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "amalfiPositanoBus",
    slug: "amalfi-positano-bus",
    contentKey: "amalfiPositanoBus",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "amalfiPositanoBus", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "aside", bodyKey: "callouts.aside" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "naplesAirportPositanoBus",
    slug: "naples-airport-positano-bus",
    contentKey: "naplesAirportPositanoBus",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "naplesAirportPositanoBus", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "naplesCenterTrainBus",
    slug: "naples-center-train-bus",
    contentKey: "naplesCenterTrainBus",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "naplesCenterTrainBus", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoAmalfiBus",
    slug: "positano-amalfi-bus",
    contentKey: "positanoAmalfiBus",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoAmalfiBus", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoNaplesAirportBus",
    slug: "positano-naples-airport-bus",
    contentKey: "positanoNaplesAirportBus",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoNaplesAirportBus", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoNaplesCenterBusTrain",
    slug: "positano-naples-center-bus-train",
    contentKey: "positanoNaplesCenterBusTrain",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoNaplesCenterBusTrain", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoSorrentoBus",
    slug: "positano-sorrento-bus",
    contentKey: "positanoSorrentoBus",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoSorrentoBus", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "ravelloPositanoBus",
    slug: "ravello-positano-bus",
    contentKey: "ravelloPositanoBus",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "ravelloPositanoBus", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoCapriFerry",
    slug: "positano-capri-ferry",
    contentKey: "positanoCapriFerry",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoCapriFerry", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoAmalfiFerry",
    slug: "positano-amalfi-ferry",
    contentKey: "positanoAmalfiFerry",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoAmalfiFerry", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "naplesCenterPositanoFerry",
    slug: "naples-center-positano-ferry",
    contentKey: "naplesCenterPositanoFerry",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "naplesCenterPositanoFerry", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoSorrentoFerry",
    slug: "positano-sorrento-ferry",
    contentKey: "positanoSorrentoFerry",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoSorrentoFerry", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoNaplesCenterFerry",
    slug: "positano-naples-center-ferry",
    contentKey: "positanoNaplesCenterFerry",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoNaplesCenterFerry", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoRavelloBus",
    slug: "positano-ravello-bus",
    contentKey: "positanoRavelloBus",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoRavelloBus", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoRavelloFerryBus",
    slug: "positano-ravello-ferry-bus",
    contentKey: "positanoRavelloFerryBus",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoRavelloFerryBus", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoSalernoFerry",
    slug: "positano-salerno-ferry",
    contentKey: "positanoSalernoFerry",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoSalernoFerry", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "salernoPositanoFerry",
    slug: "salerno-positano-ferry",
    contentKey: "salernoPositanoFerry",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "salernoPositanoFerry", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoSalernoBus",
    slug: "positano-salerno-bus",
    contentKey: "positanoSalernoBus",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoSalernoBus", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "positanoToNaplesDirectionsByFerry",
    slug: "positano-to-naples-directions-by-ferry",
    contentKey: "positanoToNaplesDirectionsByFerry",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "positanoToNaplesDirectionsByFerry", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "salernoPositanoBus",
    slug: "salerno-positano-bus",
    contentKey: "salernoPositanoBus",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "salernoPositanoBus", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "sorrentoPositanoBus",
    slug: "sorrento-positano-bus",
    contentKey: "sorrentoPositanoBus",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "sorrentoPositanoBus", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key: "sorrentoPositanoFerry",
    slug: "sorrento-positano-ferry",
    contentKey: "sorrentoPositanoFerry",
    status: "live",
    areas: ["howToGetHere"],
    primaryArea: "howToGetHere",
    structuredData: ["HowTo", "BreadcrumbList"],
    relatedGuides: [],
    blocks: [
      {
        type: "genericContent",
        options: { contentKey: "sorrentoPositanoFerry", showToc: true },
      },
      {
        type: "callout",
        options: { variant: "tip", bodyKey: "callouts.tip" },
      },
    ],
    options: {
      ogType: "article",
    },
    checklist: [
      { id: "translations", status: "complete" },
      { id: "content", status: "complete" },
      { id: "jsonLd", status: "complete" },
    ],
  }),
];

const existingManifestKeys = new Set(manifestSeed.map((entry) => entry.key));
const fallbackKeys = (GUIDE_KEYS as GuideKey[]).filter((key) => !existingManifestKeys.has(key));
const fallbackEntries = fallbackKeys.map((key) =>
  GUIDE_MANIFEST_ENTRY_SCHEMA.parse({
    key,
    slug: GUIDE_SLUGS[key]?.["en"] ?? slugify(key),
    contentKey: key,
    status: "draft",
    areas: ["experience"],
    primaryArea: "experience",
    structuredData: ["Article"],
    relatedGuides: [],
    blocks: [],
  }),
);
const allManifestEntries = [...manifestSeed, ...fallbackEntries];

export const guideManifest: GuideManifest = allManifestEntries.reduce<GuideManifest>((acc, entry) => {
  acc[entry.key] = entry;
  return acc;
}, {} as GuideManifest);

export function getGuideManifestEntry(key: GuideKey): GuideManifestEntry | undefined {
  return guideManifest[key];
}

export function listGuideManifestEntries(): GuideManifestEntry[] {
  return Object.values(guideManifest);
}

/**
 * Merges a manifest override into a base entry, returning an updated entry.
 * Browser-safe: takes overrides as parameter (no FS access).
 */
export function mergeManifestOverride(
  entry: GuideManifestEntry,
  override: { areas?: GuideArea[]; primaryArea?: GuideArea } | undefined,
): GuideManifestEntry {
  if (!override) return entry;

  const areas = override.areas ?? entry.areas;
  const primaryArea = override.primaryArea ?? entry.primaryArea;

  // Ensure primaryArea is valid for the areas
  const validPrimary = areas.includes(primaryArea) ? primaryArea : areas[0];

  return {
    ...entry,
    areas,
    primaryArea: validPrimary,
  };
}

/**
 * Gets a manifest entry with optional overrides applied.
 * Browser-safe: takes overrides as parameter (no FS access).
 */
export function getGuideManifestEntryWithOverrides(
  key: GuideKey,
  overrides?: Partial<Record<GuideKey, { areas?: GuideArea[]; primaryArea?: GuideArea }>>,
): GuideManifestEntry | undefined {
  const entry = guideManifest[key];
  if (!entry) return undefined;
  return mergeManifestOverride(entry, overrides?.[key]);
}

/**
 * Lists all manifest entries with optional overrides applied.
 * Browser-safe: takes overrides as parameter (no FS access).
 */
export function listGuideManifestEntriesWithOverrides(
  overrides?: Partial<Record<GuideKey, { areas?: GuideArea[]; primaryArea?: GuideArea }>>,
): GuideManifestEntry[] {
  if (!overrides) return Object.values(guideManifest);
  return Object.values(guideManifest).map((entry) =>
    mergeManifestOverride(entry, overrides[entry.key]),
  );
}

export type ChecklistSnapshot = {
  status: GuideStatus;
  items: ChecklistSnapshotItem[];
};

export type ChecklistSnapshotItem = GuideChecklistItem & {
  diagnostics?: GuideChecklistDiagnostics;
};

export const CHECKLIST_LABELS: Record<ChecklistItemId, string> = {
  translations: "Translations",
  jsonLd: "Structured data",
  faqs: "FAQs",
  content: "Content sections",
  media: "Media & galleries (optional)",
  seoAudit: "SEO Audit",
};

/**
 * Build the checklist payload surfaced in editorial dashboards. When entries omit a particular
 * checklist item we treat it as "missing" by default so gaps remain obvious. Future iterations
 * will replace these heuristics with lint-driven signals.
 */
export function buildGuideChecklist(
  entry: GuideManifestEntry,
  options?: {
    includeDiagnostics?: boolean;
    lang?: AppLanguage;
    includeTranslationCoverage?: boolean;
    overrides?: ManifestOverrides;
  },
): ChecklistSnapshot {
  const resolvedLang = options?.lang ?? (i18nConfig.fallbackLng as AppLanguage);
  const diagnostics = (() => {
    if (!options?.includeDiagnostics) return undefined;
    const completeness = analyzeGuideCompleteness(entry.key, resolvedLang);
    // Translation coverage analysis requires all locale bundles to be loaded.
    // In SSR/hydration contexts, only the current locale is reliably available,
    // which would cause all other locales to appear incomplete. Only compute
    // when explicitly requested (e.g., from server-only contexts like API routes).
    // For accurate cross-locale coverage, use /api/guides/bulk-translation-status.
    const coverage = options?.includeTranslationCoverage
      ? analyzeTranslationCoverage(
          entry.key,
          i18nConfig.supportedLngs as AppLanguage[],
        )
      : undefined;
    // Date validation: check if English has a date but other locales don't
    const dateValidation = options?.includeTranslationCoverage
      ? analyzeDateValidation(
          entry.key,
          i18nConfig.supportedLngs as AppLanguage[],
        )
      : undefined;
    return {
      translations: coverage,
      dateValidation,
      content: {
        intro: completeness.fields.intro,
        sections: completeness.fields.sections,
      },
      faqs: {
        count: completeness.faqCount,
        hasFaqs: completeness.fields.faqs,
      },
    } satisfies GuideChecklistDiagnostics;
  })();

  // Auto-infer status based on diagnostics and declarations
  const inferStatus = (id: ChecklistItemId): ChecklistStatus => {
    if (id === "jsonLd" && entry.structuredData.length > 0) {
      return "complete";
    }
    if (id === "content" && diagnostics?.content) {
      const { intro, sections } = diagnostics.content;
      if (intro && sections) return "complete";
      if (intro || sections) return "inProgress";
    }
    if (id === "faqs" && diagnostics?.faqs) {
      if (diagnostics.faqs.hasFaqs && diagnostics.faqs.count > 0) return "complete";
    }
    if (id === "seoAudit" && options?.overrides) {
      const audit = options.overrides[entry.key]?.auditResults;
      if (!audit) return "missing";
      if (audit.score >= 9.0) return "complete";
      return "inProgress";
    }
    return "missing";
  };

  const inferNote = (id: ChecklistItemId): string | undefined => {
    if (id === "jsonLd" && entry.structuredData.length > 0) {
      return "Structured data declared; validate generators.";
    }
    if (id === "seoAudit" && options?.overrides) {
      const audit = options.overrides[entry.key]?.auditResults;
      if (audit) {
        return `Score: ${audit.score.toFixed(1)}/10`;
      }
      return "Not audited";
    }
    return undefined;
  };

  const defaults: Record<ChecklistItemId, ChecklistSnapshotItem> = Object.fromEntries(
    CHECKLIST_ITEM_IDS.map((id) => {
      // Add audit results to seoAudit item diagnostics
      const itemDiagnostics = id === "seoAudit" && options?.overrides
        ? {
            ...diagnostics,
            seoAudit: options.overrides[entry.key]?.auditResults,
          }
        : diagnostics;

      return [
        id,
        {
          id,
          status: inferStatus(id),
          note: inferNote(id),
          diagnostics: itemDiagnostics,
        },
      ];
    }),
  ) as Record<ChecklistItemId, ChecklistSnapshotItem>;

  const overrides = (entry.checklist ?? []).reduce<Record<ChecklistItemId, ChecklistSnapshotItem>>((acc, item) => {
    // Add audit results to seoAudit item diagnostics
    const itemDiagnostics = item.id === "seoAudit" && options?.overrides
      ? {
          ...diagnostics,
          seoAudit: options.overrides[entry.key]?.auditResults,
        }
      : diagnostics;

    acc[item.id] = {
      id: item.id,
      status: item.status,
      note: item.note ?? CHECKLIST_LABELS[item.id],
      diagnostics: itemDiagnostics,
    };
    return acc;
  }, {} as Record<ChecklistItemId, ChecklistSnapshotItem>);

  const merged = CHECKLIST_ITEM_IDS.map((id) => {
    const source = overrides[id] ?? defaults[id];
    return {
      ...source,
      note: source.note ?? CHECKLIST_LABELS[id],
    };
  });

  return {
    status: entry.status,
    items: merged,
  };
}

export function resolveDraftPathSegment(entry: GuideManifestEntry): string {
  const explicit = entry.draftPathSegment?.trim();
  if (explicit) return explicit;
  const slug = entry.slug.trim();
  if (!slug) return `guides/${entry.key}`;
  return slug.includes("/") ? slug : `guides/${slug}`;
}

export type GuidePublicationStatus = "draft" | "review" | "published";

export function buildGuideStatusMap(
  entries: Iterable<GuideManifestEntry>,
): Record<GuideKey, GuidePublicationStatus> {
  const map: Partial<Record<GuideKey, GuidePublicationStatus>> = {};
  for (const entry of entries) {
    let status: GuidePublicationStatus;
    if (entry.status === "live") {
      status = entry.draftOnly ? "review" : "published";
    } else if (entry.status === "review") {
      status = "review";
    } else {
      status = "draft";
    }
    map[entry.key] = status;
  }
  return map as Record<GuideKey, GuidePublicationStatus>;
}

export function formatGuideManifestEntry(
  entry: GuideManifestEntryInput,
  indent = 2,
): string {
  const normalized = GUIDE_MANIFEST_ENTRY_SCHEMA.parse(entry);
  const json = JSON.stringify(normalized, null, 2).replace(/"([^"]+)":/g, "$1:");
  const lines = json.split("\n");
  const pad = " ".repeat(indent);
  if (lines.length <= 2) {
    return `${pad}GUIDE_MANIFEST_ENTRY_SCHEMA.parse({}),`;
  }
  const inner = lines
    .slice(1, -1)
    .map((line) => `${pad}  ${line}`)
    .join("\n");
  return `${pad}GUIDE_MANIFEST_ENTRY_SCHEMA.parse({\n${inner}\n${pad}}),`;
}
