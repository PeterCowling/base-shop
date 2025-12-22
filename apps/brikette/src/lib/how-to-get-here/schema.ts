import { z } from "zod";

import { GUIDE_KEYS_WITH_OVERRIDES as GUIDE_KEYS, type GuideKey } from "../../guide-slug-map";
import HOW_TO_GET_HERE_SCHEMA_EN from "../../locales/en/howToGetHereSchema.json";

/* -------------------------------------------------------------------------- */
/* Route definition schema (src/data/how-to-get-here/routes.json)             */
/* -------------------------------------------------------------------------- */

const { errors: HOW_TO_GET_HERE_SCHEMA_ERRORS } = HOW_TO_GET_HERE_SCHEMA_EN;

const GUIDE_KEY_SET = new Set<GuideKey>(GUIDE_KEYS as readonly GuideKey[]);

const guideKeySchema: z.ZodType<GuideKey> = z.custom<GuideKey>(
  (value): value is GuideKey => typeof value === "string" && GUIDE_KEY_SET.has(value as GuideKey),
  { message: HOW_TO_GET_HERE_SCHEMA_ERRORS.invalidGuideKey },
);

// Branded primitives to reduce accidental interchange at compile-time
export const slugSchema = z.string().min(1).brand<"Slug">();
export type Slug = z.infer<typeof slugSchema>;

export const contentKeySchema = z.string().min(1).brand<"ContentKey">();
export type ContentKey = z.infer<typeof contentKeySchema>;

export const linkTargetSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("howToOverview") }),
  z.object({ type: z.literal("external"), href: z.string().min(1) }),
  z.object({ type: z.literal("guide"), guideKey: guideKeySchema }),
  z.object({ type: z.literal("directions"), slug: slugSchema }),
  z.object({ type: z.literal("guidesSlug"), slug: slugSchema }),
]);

export const linkBindingSchema = z.object({
  key: z.string().min(1),
  placeholders: z.record(linkTargetSchema.nullable()).optional(),
  linkObject: linkTargetSchema.optional(),
});

export const mediaBindingSchema = z.object({
  key: z.string().min(1),
  src: z.string().min(1),
  preset: z.string().min(1).optional(),
  aspectRatio: z.string().min(1).optional(),
});

export const galleryBindingItemSchema = z.object({
  id: z.string().min(1),
  src: z.string().min(1),
  preset: z.string().min(1).optional(),
  aspectRatio: z.string().min(1).optional(),
});

export const galleryBindingSchema = z.object({
  key: z.string().min(1),
  items: z.array(galleryBindingItemSchema).min(1),
});

export const linkListBindingItemSchema = z.object({
  id: z.string().min(1),
  target: linkTargetSchema,
});

export const linkListBindingSchema = z.object({
  key: z.string().min(1),
  items: z.array(linkListBindingItemSchema).min(1),
});

export const routeDefinitionSchema = z.object({
  contentKey: contentKeySchema,
  linkBindings: z.array(linkBindingSchema).optional(),
  media: z.array(mediaBindingSchema).optional(),
  galleries: z.array(galleryBindingSchema).optional(),
  linkLists: z.array(linkListBindingSchema).optional(),
  sectionsRoot: z.string().nullable().optional(),
  sectionPaths: z.array(z.string().min(1)).optional(),
  status: z.enum(["draft", "review", "published"]).optional(),
});

export const howToGetHereRouteDefinitionsSchema = z.object({
  routes: z.record(routeDefinitionSchema),
});

export type LinkTarget = z.infer<typeof linkTargetSchema>;
export type LinkBinding = z.infer<typeof linkBindingSchema>;
export type MediaBinding = z.infer<typeof mediaBindingSchema>;
export type GalleryBindingItem = z.infer<typeof galleryBindingItemSchema>;
export type GalleryBinding = z.infer<typeof galleryBindingSchema>;
export type LinkListBindingItem = z.infer<typeof linkListBindingItemSchema>;
export type LinkListBinding = z.infer<typeof linkListBindingSchema>;
export type RouteDefinitionDocument = z.infer<typeof howToGetHereRouteDefinitionsSchema>;
export type RouteDefinitionEntry = z.infer<typeof routeDefinitionSchema>;

/* -------------------------------------------------------------------------- */
/* Locale content schema (src/locales/[lang]/how-to-get-here/routes/*.json)   */
/* -------------------------------------------------------------------------- */

export type LinkedCopy = {
  before?: string | undefined;
  linkLabel: string;
  after?: string | undefined;
};

export type RouteContentValue =
  | string
  | LinkedCopy
  | RouteContentValue[]
  | { [key: string]: RouteContentValue };

const linkedCopySchema: z.ZodType<LinkedCopy> = z.object({
  before: z.string().optional(),
  linkLabel: z.string().min(1),
  after: z.string().optional(),
});

const contentValueSchema: z.ZodType<RouteContentValue> = z.lazy(() =>
  z.union([
    z.string(),
    linkedCopySchema,
    z.array(contentValueSchema),
    z.record(contentValueSchema),
  ]),
);

export const routeContentSchema = z
  .record(contentValueSchema)
  .superRefine((value, ctx) => {
    const meta = value["meta"];
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: HOW_TO_GET_HERE_SCHEMA_ERRORS.missingMetaBlock,
        path: ["meta"],
      });
      return;
    }

    const metaRecord = meta as Record<string, unknown>;
    if (typeof metaRecord["title"] !== "string" || metaRecord["title"].trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: HOW_TO_GET_HERE_SCHEMA_ERRORS.metaTitleRequired,
        path: ["meta", "title"],
      });
    }
    if (typeof metaRecord["description"] !== "string" || metaRecord["description"].trim() === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: HOW_TO_GET_HERE_SCHEMA_ERRORS.metaDescriptionRequired,
        path: ["meta", "description"],
      });
    }
  });

export const howToGetHereRoutesLocaleSchema = z.record(routeContentSchema);

export type HowToGetHereRoutesLocale = z.infer<typeof howToGetHereRoutesLocaleSchema>;
export type RouteContent = z.infer<typeof routeContentSchema>;
