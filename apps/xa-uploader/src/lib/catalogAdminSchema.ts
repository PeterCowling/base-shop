/* eslint-disable -- XAUP-0001 [ttl=2026-12-31] uploader admin schema pending i18n/security audit */

import { z } from "zod";

import type { XaCategory, XaDepartment } from "./xaTypes";

export function splitList(input: string): string[] {
  return input
    .split(/[|,\n]+/g)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinList(items: string[]): string {
  return items.map((item) => item.trim()).filter(Boolean).join("|");
}

export function slugify(input: string): string {
  if (!input) return "";
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/_/g, " ")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

const departmentSchema = z.enum(["women", "men"]) satisfies z.ZodType<XaDepartment>;
const categorySchema = z.enum(["clothing", "bags", "jewelry"]) satisfies z.ZodType<XaCategory>;

const numberField = (label: string, options?: { min?: number; integer?: boolean }) => {
  const min = options?.min ?? 0;
  const integer = options?.integer ?? false;
  return z
    .union([z.number(), z.string()])
    .transform((value, ctx) => {
      const raw = typeof value === "number" ? String(value) : value;
      const trimmed = raw.trim();
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid ${label}` });
        return z.NEVER;
      }
      if (parsed < min) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be ≥ ${min}` });
        return z.NEVER;
      }
      if (integer && !Number.isInteger(parsed)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be an integer` });
        return z.NEVER;
      }
      return parsed;
    });
};

const optionalNumberField = (
  label: string,
  options?: { min?: number; integer?: boolean },
) =>
  z
    .union([z.number(), z.string(), z.undefined()])
    .optional()
    .transform((value, ctx) => {
      if (value === undefined) return undefined;
      const raw = typeof value === "number" ? String(value) : value;
      const trimmed = raw.trim();
      if (!trimmed) return undefined;
      const parsed = Number(trimmed);
      if (!Number.isFinite(parsed)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Invalid ${label}` });
        return z.NEVER;
      }
      const min = options?.min ?? 0;
      const integer = options?.integer ?? false;
      if (parsed < min) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be ≥ ${min}` });
        return z.NEVER;
      }
      if (integer && !Number.isInteger(parsed)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${label} must be an integer` });
        return z.NEVER;
      }
      return parsed;
    });

export const catalogProductDraftSchema = z
  .object({
    id: z.string().trim().optional(),
    slug: z.string().trim().optional(),
    title: z.string().trim().min(1, "Title is required"),
    brandHandle: z.string().trim().min(1, "Brand handle is required"),
    brandName: z.string().trim().optional(),
    collectionHandle: z.string().trim().optional(),
    collectionTitle: z.string().trim().optional(),
    collectionDescription: z.string().trim().optional(),
    price: numberField("Price", { min: 0 }),
    compareAtPrice: optionalNumberField("Compare-at price", { min: 0 }),
    deposit: optionalNumberField("Deposit", { min: 0 }),
    stock: optionalNumberField("Stock", { min: 0, integer: true }),
    forSale: z.boolean().optional(),
    forRental: z.boolean().optional(),
    sizes: z.string().optional(),
    description: z.string().trim().min(1, "Description is required"),
    createdAt: z.string().trim().min(1, "Created at is required"),
    popularity: optionalNumberField("Popularity", { min: 0, integer: true }),
    imageFiles: z.string().optional(),
    imageAltTexts: z.string().optional(),
    taxonomy: z.object({
      department: departmentSchema,
      category: categorySchema,
      subcategory: z.string().trim().min(1, "Subcategory is required"),
      color: z.string().optional(),
      material: z.string().optional(),
      fit: z.string().optional(),
      length: z.string().optional(),
      neckline: z.string().optional(),
      sleeveLength: z.string().optional(),
      pattern: z.string().optional(),
      occasion: z.string().optional(),
      sizeClass: z.string().optional(),
      strapStyle: z.string().optional(),
      hardwareColor: z.string().optional(),
      closureType: z.string().optional(),
      fits: z.string().optional(),
      metal: z.string().optional(),
      gemstone: z.string().optional(),
      jewelrySize: z.string().optional(),
      jewelryStyle: z.string().optional(),
      jewelryTier: z.string().optional(),
    }),
    details: z
      .object({
        modelHeight: z.string().optional(),
        modelSize: z.string().optional(),
        fitNote: z.string().optional(),
        fabricFeel: z.string().optional(),
        care: z.string().optional(),
        dimensions: z.string().optional(),
        strapDrop: z.string().optional(),
        whatFits: z.string().optional(),
        interior: z.string().optional(),
        sizeGuide: z.string().optional(),
        warranty: z.string().optional(),
      })
      .optional(),
  })
  .superRefine((value, ctx) => {
    const collectionHandle = (value.collectionHandle ?? "").trim();
    const collectionTitle = (value.collectionTitle ?? "").trim();
    if (!collectionHandle && !collectionTitle) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["collectionHandle"],
        message: "Collection handle or title is required",
      });
    }

    const colors = splitList(value.taxonomy.color ?? "");
    if (!colors.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["taxonomy", "color"],
        message: "At least one color is required",
      });
    }

    const materials = splitList(value.taxonomy.material ?? "");
    if (!materials.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["taxonomy", "material"],
        message: "At least one material is required",
      });
    }

    const imageFiles = splitList(value.imageFiles ?? "");
    const imageAltTexts = splitList(value.imageAltTexts ?? "");
    if (imageAltTexts.length && imageAltTexts.length !== imageFiles.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["imageAltTexts"],
        message: "Image alt texts must match the number of images",
      });
    }

    if (value.taxonomy.category === "clothing") {
      const sizes = splitList(value.sizes ?? "");
      if (!sizes.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["sizes"],
          message: "Sizes are required for clothing",
        });
      }
    }

    if (value.taxonomy.category === "jewelry") {
      const metal = (value.taxonomy.metal ?? "").trim();
      if (!metal) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["taxonomy", "metal"],
          message: "Metal is required for jewelry",
        });
      }
    }

    const parsed = Date.parse(value.createdAt);
    if (Number.isNaN(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["createdAt"],
        message: "createdAt must be a valid date/time",
      });
    }
  });

export type CatalogProductDraftInput = z.input<typeof catalogProductDraftSchema>;
export type CatalogProductDraft = z.output<typeof catalogProductDraftSchema>;
