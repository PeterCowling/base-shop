/**
 * Guide block type system.
 *
 * Defines the 14 block types available for composing guide pages,
 * along with their Zod schemas and TypeScript types.
 *
 * Extracted from apps/brikette/src/routes/guides/blocks/types.ts
 */
/* eslint-disable ds/no-hardcoded-copy -- GS-001: Zod schema messages rely on literal copy for developer guidance. */
import { z } from "zod";

const IMAGE_FORMAT_VALUES = ["auto", "webp", "jpg", "png"] as const;

export const GUIDE_BLOCK_TYPES = [
  "hero",
  "genericContent",
  "faq",
  "callout",
  "table",
  "serviceSchema",
  "breadcrumbs",
  "relatedGuides",
  "alsoHelpful",
  "planChoice",
  "transportNotice",
  "transportDropIn",
  "jsonLd",
  "custom",
] as const;

export type GuideBlockType = (typeof GUIDE_BLOCK_TYPES)[number];

const heroBlockOptionsSchema = z
  .object({
    image: z.string().min(1, "Hero image path is required"),
    altKey: z.string().min(1).optional(),
    alt: z.string().min(1).optional(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    quality: z.number().int().min(10).max(100).optional(),
    format: z.enum(IMAGE_FORMAT_VALUES).optional(),
    aspectRatio: z.string().min(3).optional(),
    preset: z.string().min(1).optional(),
    showIntro: z.boolean().optional(),
    introLimit: z.number().int().positive().optional(),
    className: z.string().min(1).optional(),
  })
  .strict();

const genericContentBlockOptionsSchema = z
  .object({
    contentKey: z.string().min(1).optional(),
    showToc: z.boolean().optional(),
    faqHeadingLevel: z.union([z.literal(2), z.literal(3)]).optional(),
    renderWhenEmpty: z.boolean().optional(),
    sectionTopExtrasKey: z.string().min(1).optional(),
    sectionBottomExtrasKey: z.string().min(1).optional(),
  })
  .strict()
  .optional();

const faqBlockOptionsSchema = z
  .object({
    fallbackKey: z.string().min(1).optional(),
    alwaysProvideFallback: z.boolean().optional(),
    preferManualWhenUnlocalized: z.boolean().optional(),
    suppressWhenUnlocalized: z.boolean().optional(),
  })
  .strict()
  .optional();

const calloutBlockOptionsSchema = z
  .object({
    variant: z.enum(["tip", "cta", "aside"]),
    titleKey: z.string().min(1).optional(),
    bodyKey: z.string().min(1),
  })
  .strict();

const tableBlockOptionsSchema = z
  .object({
    id: z.string().min(1).optional(),
    titleKey: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    columns: z
      .array(
        z.object({
          key: z.string().min(1),
          label: z.string().min(1),
          align: z.enum(["left", "center", "right"]).optional(),
        }),
      )
      .min(1),
    rows: z.array(z.record(z.string(), z.string())).min(1),
  })
  .strict();

const serviceSchemaBlockOptionsSchema = z
  .object({
    contentKey: z.string().min(1).optional(),
    serviceTypeKey: z.string().min(1).optional(),
    areaServedKey: z.string().min(1).optional(),
    providerNameKey: z.string().min(1).optional(),
    descriptionKey: z.string().min(1).optional(),
    nameKey: z.string().min(1).optional(),
    image: z.string().min(1).optional(),
    sameAsKeys: z.array(z.string().min(1)).optional(),
    offersKey: z.string().min(1).optional(),
    module: z.string().min(1).optional(),
    source: z.string().min(1).optional(),
  })
  .strict()
  .optional();

const breadcrumbsBlockOptionsSchema = z
  .object({
    source: z.string().min(1).optional(),
  })
  .strict()
  .optional();

const relatedGuidesBlockOptionsSchema = z
  .object({
    guides: z
      .array(
        z.custom<string>((value) => typeof value === "string", {
          message: "Invalid guide key",
        }),
      )
      .optional(),
    max: z.number().int().positive().optional(),
    includePrimary: z.boolean().optional(),
  })
  .strict()
  .optional();

const alsoHelpfulBlockOptionsSchema = z
  .object({
    tags: z.array(z.string().min(1)).min(1),
    excludeGuide: z
      .union([
        z.custom<string>((value) => typeof value === "string"),
        z.array(z.custom<string>((value) => typeof value === "string")),
      ])
      .optional(),
    includeRooms: z.boolean().optional(),
    titleKey: z
      .union([
        z.string().min(1),
        z.object({ ns: z.string().min(1), key: z.string().min(1) }),
      ])
      .optional(),
    section: z.string().min(1).optional(),
  })
  .strict();

const planChoiceBlockOptionsSchema = z
  .object({
    variant: z.enum(["default", "compact", "wide"]).optional(),
  })
  .strict()
  .optional();

const transportNoticeBlockOptionsSchema = z
  .object({
    variant: z.enum(["default", "compact"]).optional(),
  })
  .strict()
  .optional();

const transportDropInBlockOptionsSchema = z
  .object({
    component: z.enum(["chiesaNuovaArrivals"]),
  })
  .strict();

const jsonLdBlockOptionsSchema = z
  .object({
    module: z.string().min(1),
    exportName: z.string().min(1).optional(),
  })
  .strict();

const customBlockOptionsSchema = z
  .object({
    module: z.string().min(1),
    exportName: z.string().min(1).optional(),
  })
  .strict();

export type HeroBlockOptions = z.infer<typeof heroBlockOptionsSchema>;
export type GenericContentBlockOptions = z.infer<typeof genericContentBlockOptionsSchema>;
export type FaqBlockOptions = z.infer<typeof faqBlockOptionsSchema>;
export type CalloutBlockOptions = z.infer<typeof calloutBlockOptionsSchema>;
export type TableBlockOptions = z.infer<typeof tableBlockOptionsSchema>;
export type ServiceSchemaBlockOptions = z.infer<typeof serviceSchemaBlockOptionsSchema>;
export type BreadcrumbsBlockOptions = z.infer<typeof breadcrumbsBlockOptionsSchema>;
export type RelatedGuidesBlockOptions = z.infer<typeof relatedGuidesBlockOptionsSchema>;
export type AlsoHelpfulBlockOptions = z.infer<typeof alsoHelpfulBlockOptionsSchema>;
export type PlanChoiceBlockOptions = z.infer<typeof planChoiceBlockOptionsSchema>;
export type TransportNoticeBlockOptions = z.infer<typeof transportNoticeBlockOptionsSchema>;
export type TransportDropInBlockOptions = z.infer<typeof transportDropInBlockOptionsSchema>;
export type JsonLdBlockOptions = z.infer<typeof jsonLdBlockOptionsSchema>;
export type CustomBlockOptions = z.infer<typeof customBlockOptionsSchema>;

export type HeroBlock = { type: "hero"; options: HeroBlockOptions };
export type GenericContentBlock = { type: "genericContent"; options?: GenericContentBlockOptions };
export type FaqBlock = { type: "faq"; options?: FaqBlockOptions };
export type CalloutBlock = { type: "callout"; options: CalloutBlockOptions };
export type TableBlock = { type: "table"; options: TableBlockOptions };
export type ServiceSchemaBlock = { type: "serviceSchema"; options?: ServiceSchemaBlockOptions };
export type BreadcrumbsBlock = { type: "breadcrumbs"; options?: BreadcrumbsBlockOptions };
export type RelatedGuidesBlock = { type: "relatedGuides"; options?: RelatedGuidesBlockOptions };
export type AlsoHelpfulBlock = { type: "alsoHelpful"; options: AlsoHelpfulBlockOptions };
export type PlanChoiceBlock = { type: "planChoice"; options?: PlanChoiceBlockOptions };
export type TransportNoticeBlock = { type: "transportNotice"; options?: TransportNoticeBlockOptions };
export type TransportDropInBlock = { type: "transportDropIn"; options: TransportDropInBlockOptions };
export type JsonLdBlock = { type: "jsonLd"; options: JsonLdBlockOptions };
export type CustomBlock = { type: "custom"; options: CustomBlockOptions };

export type GuideBlockDeclaration =
  | HeroBlock
  | GenericContentBlock
  | FaqBlock
  | CalloutBlock
  | TableBlock
  | ServiceSchemaBlock
  | BreadcrumbsBlock
  | RelatedGuidesBlock
  | AlsoHelpfulBlock
  | PlanChoiceBlock
  | TransportNoticeBlock
  | TransportDropInBlock
  | JsonLdBlock
  | CustomBlock;

export const GUIDE_BLOCK_DECLARATION_SCHEMA = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), options: heroBlockOptionsSchema }),
  z.object({ type: z.literal("genericContent"), options: genericContentBlockOptionsSchema }),
  z.object({ type: z.literal("faq"), options: faqBlockOptionsSchema }),
  z.object({ type: z.literal("callout"), options: calloutBlockOptionsSchema }),
  z.object({ type: z.literal("table"), options: tableBlockOptionsSchema }),
  z.object({ type: z.literal("serviceSchema"), options: serviceSchemaBlockOptionsSchema }),
  z.object({ type: z.literal("breadcrumbs"), options: breadcrumbsBlockOptionsSchema }),
  z.object({ type: z.literal("relatedGuides"), options: relatedGuidesBlockOptionsSchema }),
  z.object({ type: z.literal("alsoHelpful"), options: alsoHelpfulBlockOptionsSchema }),
  z.object({ type: z.literal("planChoice"), options: planChoiceBlockOptionsSchema }),
  z.object({ type: z.literal("transportNotice"), options: transportNoticeBlockOptionsSchema }),
  z.object({ type: z.literal("transportDropIn"), options: transportDropInBlockOptionsSchema }),
  z.object({ type: z.literal("jsonLd"), options: jsonLdBlockOptionsSchema }),
  z.object({ type: z.literal("custom"), options: customBlockOptionsSchema }),
]);
