// @acme/guide-system — shared guide types, schemas, and utilities
//
// This package contains types and pure functions shared between
// brikette (public guide rendering) and business-os (guide authoring).
// No React, Next.js, or app-specific dependencies.

// Languages
export { type AppLanguage,SUPPORTED_LANGUAGES } from "./languages";

// Block types
export {
  type AlsoHelpfulBlock,
  type AlsoHelpfulBlockOptions,
  type BreadcrumbsBlock,
  type BreadcrumbsBlockOptions,
  type CalloutBlock,
  type CalloutBlockOptions,
  type CustomBlock,
  type CustomBlockOptions,
  type FaqBlock,
  type FaqBlockOptions,
  type GenericContentBlock,
  type GenericContentBlockOptions,
  GUIDE_BLOCK_DECLARATION_SCHEMA,
  GUIDE_BLOCK_TYPES,
  type GuideBlockDeclaration,
  type GuideBlockType,
  type HeroBlock,
  type HeroBlockOptions,
  type JsonLdBlock,
  type JsonLdBlockOptions,
  type PlanChoiceBlock,
  type PlanChoiceBlockOptions,
  type RelatedGuidesBlock,
  type RelatedGuidesBlockOptions,
  type ServiceSchemaBlock,
  type ServiceSchemaBlockOptions,
  type TableBlock,
  type TableBlockOptions,
  type TransportDropInBlock,
  type TransportDropInBlockOptions,
  type TransportNoticeBlock,
  type TransportNoticeBlockOptions,
} from "./block-types";

// Manifest types
export {
  CHECKLIST_ITEM_IDS,
  CHECKLIST_LABELS,
  CHECKLIST_STATUS_VALUES,
  type ChecklistItemId,
  type ChecklistSnapshot,
  type ChecklistSnapshotItem,
  type ChecklistStatus,
  createManifestEntrySchema,
  GUIDE_AREA_VALUES,
  GUIDE_STATUS_VALUES,
  GUIDE_TEMPLATE_VALUES,
  type GuideArea,
  type GuideAreaSlugKey,
  guideAreaToSlugKey,
  type GuideChecklistItem,
  type GuideManifest,
  type GuideManifestEntry,
  type GuideManifestEntryInput,
  type GuideRouteExpectations,
  type GuideRouteOptions,
  type GuideStatus,
  type GuideTemplate,
  resolveGuideStatusForSite,
  STRUCTURED_DATA_TYPES,
  type StructuredDataDeclaration,
  type StructuredDataType,
} from "./manifest-types";

// Manifest overrides
export {
  createManifestOverride,
  type ManifestOverride,
  type ManifestOverrides,
  manifestOverrideSchema,
  manifestOverridesSchema,
  safeParseManifestOverride,
  safeParseManifestOverrides,
  type SeoAuditResult,
  validateManifestOverride,
  validateManifestOverrides,
} from "./manifest-overrides";

// Content schema
export {
  type GuideContentInput,
  guideContentSchema,
} from "./content-schema";

// Diagnostic types
export type {
  DateValidationResult,
  GuideChecklistDiagnostics,
  GuideDiagnosticResult,
  GuideFieldStatus,
  SeoFieldStatus,
  TranslationCoverageLocale,
  TranslationCoverageResult,
} from "./diagnostics-types";

// Markup utilities
export {
  sanitizeLinkLabel,
  stripGuideLinkTokens,
  stripGuideMarkup,
} from "./markup";

// Slug utilities
export {
  slugify,
  slugifyWithFallback,
} from "./slugify";

// Manifest registry (shared access layer)
export {
  getGuideManifestEntry,
  getGuideManifestEntryWithOverrides,
  listGuideManifestEntries,
  listGuideManifestEntriesWithOverrides,
  mergeManifestOverride,
  registerManifestEntries,
  resolveDraftPathSegment,
} from "./manifest-registry";
