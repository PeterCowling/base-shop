/**
 * Guide manifest types and schemas.
 *
 * Contains the type definitions for guide manifest entries, status values,
 * areas, templates, structured data, checklists, and route options.
 * The actual manifest data (guide entries) stays in brikette.
 *
 * Extracted from apps/brikette/src/routes/guides/guide-manifest.ts (types only).
 */
import { z } from "zod";

import { GUIDE_BLOCK_DECLARATION_SCHEMA, type GuideBlockDeclaration } from "./block-types";

export const GUIDE_STATUS_VALUES = ["draft", "review", "live"] as const;
export type GuideStatus = (typeof GUIDE_STATUS_VALUES)[number];

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

export const CHECKLIST_ITEM_IDS = ["translations", "jsonLd", "faqs", "content", "seoAudit"] as const;
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
 * Guide manifest entry type.
 * `key` is a string — concrete key unions are defined per-app.
 */
export type GuideManifestEntry = {
  key: string;
  slug: string;
  contentKey: string;
  status: GuideStatus;
  draftOnly?: boolean | undefined;
  draftPathSegment?: string;
  areas: GuideArea[];
  primaryArea: GuideArea;
  metaKey?: string;
  structuredData: StructuredDataDeclaration[];
  relatedGuides: string[];
  blocks: GuideBlockDeclaration[];
  options?: GuideRouteOptions;
  expectations?: GuideRouteExpectations;
  checklist?: GuideChecklistItem[];
  template?: GuideTemplate;
  focusKeyword?: string;
  primaryQuery?: string;
  timeSensitive?: boolean;
  /** Per-site publication status overrides. Key is the site identifier (e.g. "brikette"). */
  sites?: Record<string, { status?: GuideStatus }>;
};

/**
 * Creates a Zod schema for manifest entries given a set of valid guide keys.
 * This allows each app to provide its own key validation.
 */
export function createManifestEntrySchema(guideKeys: readonly string[]) {
  const keySet = new Set(guideKeys);
  const guideKeySchema = z.custom<string>(
    (value) => typeof value === "string" && keySet.has(value),
    { message: "Invalid guide key" },
  );

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
      if (typeof candidate === "string") return candidate as StructuredDataType;
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

  const base = z
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
      sites: z
        .record(
          z.string(),
          z.object({ status: z.enum(GUIDE_STATUS_VALUES).optional() }),
        )
        .optional(),
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

  const schema = base.transform((value) => {
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
      sites,
      ...rest
    } = value;
    const cleanOptions = options
      ? (Object.fromEntries(
          Object.entries(options).filter(([, v]) => typeof v !== "undefined"),
        ) as GuideRouteOptions)
      : undefined;
    const cleanExpectations = expectations
      ? (Object.fromEntries(
          Object.entries(expectations).filter(([, v]) => typeof v !== "undefined"),
        ) as GuideRouteExpectations)
      : undefined;
    const cleanChecklist = Array.isArray(checklist)
      ? checklist.map((item) => {
          const { note, ...r } = item;
          return { ...r, ...(typeof note === "string" ? { note } : {}) };
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
      ...(sites ? { sites } : {}),
      status: (value.status ?? "draft") as GuideStatus,
      structuredData: value.structuredData ?? [],
      relatedGuides: value.relatedGuides ?? [],
      blocks: value.blocks ?? [],
    } satisfies GuideManifestEntry;
  });

  return { base, schema, guideKeySchema };
}

export type GuideManifestEntryInput = z.input<
  ReturnType<typeof createManifestEntrySchema>["base"]
>;

export type GuideManifest = Record<string, GuideManifestEntry>;

/**
 * Resolve the effective status of a guide for a specific site.
 * Checks `entry.sites?.[siteKey]?.status` first, falls back to `entry.status`.
 */
export function resolveGuideStatusForSite(
  entry: GuideManifestEntry,
  siteKey: string,
): GuideStatus {
  return entry.sites?.[siteKey]?.status ?? entry.status;
}

// ── Checklist snapshot types (used by editorial sidebar) ──

export type ChecklistSnapshotItem = GuideChecklistItem & {
  diagnostics?: import("./diagnostics-types").GuideChecklistDiagnostics;
};

export type ChecklistSnapshot = {
  items: ChecklistSnapshotItem[];
};

export const CHECKLIST_LABELS: Record<ChecklistItemId, string> = {
  translations: "Translations",
  jsonLd: "JSON-LD",
  faqs: "FAQs",
  content: "Content",
  seoAudit: "SEO Audit",
};
