import { z } from "zod";

import { LOCALES } from "@acme/types";

const localeSchema = z.enum(LOCALES);

const publicationStatusSchema = z.enum([
  "draft",
  "review",
  "scheduled",
  "active",
  "archived",
]);

const translatedTextInputSchema = z.union([
  z.string(),
  z.record(localeSchema, z.string()),
]);

const mediaItemInputSchema = z
  .union([
    z.string().min(1),
    z
      .object({
        url: z.string().min(1),
        type: z.enum(["image", "video"]).optional(),
        title: z.string().optional(),
        altText: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
      .strict(),
  ])
  ;

export const productImportItemSchema = z
  .object({
    /** Optional stable ULID; when omitted we create a new id. */
    id: z.string().ulid().optional(),
    /** Required to create; used to match when id is omitted. */
    sku: z.string().min(1).optional(),
    title: translatedTextInputSchema.optional(),
    description: translatedTextInputSchema.optional(),
    /** Unit price in minor currency units (e.g. cents). */
    price: z.number().int().nonnegative().optional(),
    /** ISO-4217 code (e.g. EUR). */
    currency: z.string().min(1).max(8).optional(),
    status: publicationStatusSchema.optional(),
    publishShops: z.array(z.string().min(1)).optional(),
    media: z.array(mediaItemInputSchema).optional(),
    rentalTerms: z.string().optional(),
    deposit: z.number().int().nonnegative().optional(),
    forSale: z.boolean().optional(),
    forRental: z.boolean().optional(),
    dailyRate: z.number().int().nonnegative().optional(),
    weeklyRate: z.number().int().nonnegative().optional(),
    monthlyRate: z.number().int().nonnegative().optional(),
    wearAndTearLimit: z.number().int().nonnegative().optional(),
    maintenanceCycle: z.number().int().nonnegative().optional(),
    availability: z
      .array(
        z
          .object({
            from: z.string(),
            to: z.string(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();

export type ProductImportItem = z.infer<typeof productImportItemSchema>;

export const productImportRequestSchema = z
  .object({
    idempotencyKey: z.string().uuid(),
    items: z.array(productImportItemSchema).min(1),
    dryRun: z.boolean().optional(),
    note: z.string().max(500).optional(),
    defaultStatus: publicationStatusSchema.optional(),
  })
  .strict();

export type ProductImportRequest = z.infer<typeof productImportRequestSchema>;

export type ProductImportActor = {
  customerId?: string;
  role?: string;
};

export type ProductImportRowResult = {
  row: number;
  action: "created" | "updated" | "skipped" | "error";
  id?: string;
  sku?: string;
  message?: string;
  details?: unknown;
};

export type ProductImportReport = {
  shop: string;
  idempotencyKey: string;
  dryRun: boolean;
  importedAt: string;
  importedBy?: ProductImportActor;
  note?: string;
  created: number;
  updated: number;
  skipped: number;
  errors: number;
  results: ProductImportRowResult[];
};

const actorSchema = z
  .object({
    customerId: z.string().optional(),
    role: z.string().optional(),
  })
  .strict();

export const productImportEventSchema = z
  .object({
    id: z.string().min(1),
    idempotencyKey: z.string().uuid(),
    shop: z.string().min(1),
    importedAt: z.string().min(1),
    importedBy: actorSchema.optional(),
    note: z.string().optional(),
    report: z
      .object({
        created: z.number().int().nonnegative(),
        updated: z.number().int().nonnegative(),
        skipped: z.number().int().nonnegative(),
        errors: z.number().int().nonnegative(),
        results: z.array(
          z
            .object({
              row: z.number().int().nonnegative(),
              action: z.enum(["created", "updated", "skipped", "error"]),
              id: z.string().optional(),
              sku: z.string().optional(),
              message: z.string().optional(),
              details: z.unknown().optional(),
            })
            .strict(),
        ),
      })
      .strict(),
  })
  .strict();

export type ProductImportEvent = z.infer<typeof productImportEventSchema>;
