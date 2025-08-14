import { z } from "zod";
import {
  localeSchema,
  type Locale,
  type ShopSeoFields,
  aiCatalogFieldSchema,
} from "@acme/types";
import { shopSchema, type ShopForm } from "../../actions/schemas";

export type { ShopForm };

export function parseShopForm(formData: FormData): {
  data?: ShopForm;
  errors?: Record<string, string[]>;
} {
  const themeDefaultsRaw = formData.get("themeDefaults") as string | null;
  const themeOverridesRaw = formData.get("themeOverrides") as string | null;
  const filterKeys = formData.getAll("filterMappingsKey").map(String);
  const filterValues = formData.getAll("filterMappingsValue").map(String);
  const filterMappings = JSON.stringify(
    Object.fromEntries(
      filterKeys
        .map((k, i) => [k.trim(), filterValues[i]?.trim() ?? ""])
        .filter(([k, v]) => k && v),
    ),
  );
  const priceKeys = formData.getAll("priceOverridesKey").map(String);
  const priceValues = formData
    .getAll("priceOverridesValue")
    .map((v) => Number(v));
  const priceOverrides = JSON.stringify(
    Object.fromEntries(
      priceKeys
        .map((k, i) => [k.trim(), priceValues[i]])
        .filter(([k, v]) => k && !Number.isNaN(v)),
    ),
  );
  const localeKeys = formData.getAll("localeOverridesKey").map(String);
  const localeValues = formData.getAll("localeOverridesValue").map(String);
  const localeOverrides = JSON.stringify(
    Object.fromEntries(
      localeKeys
        .map((k, i) => [k.trim(), localeValues[i]?.trim() ?? ""])
        .filter(([k, v]) => k && v),
    ),
  );

  const entries = Array.from(formData.entries()).filter(
    ([k]) =>
      ![
        "filterMappingsKey",
        "filterMappingsValue",
        "priceOverridesKey",
        "priceOverridesValue",
        "localeOverridesKey",
        "localeOverridesValue",
      ].includes(k),
  );

  const parsed = shopSchema.safeParse({
    ...Object.fromEntries(entries),
    themeDefaults: themeDefaultsRaw ?? "{}",
    themeOverrides: themeOverridesRaw ?? "{}",
    trackingProviders: formData.getAll("trackingProviders"),
    filterMappings,
    priceOverrides,
    localeOverrides,
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

const seoSchema = z
  .object({
    locale: localeSchema,
    title: z.string().min(1, "Required"),
    description: z.string().optional().default(""),
    image: z.string().url().optional(),
    alt: z.string().optional(),
    canonicalBase: z.string().url().optional(),
    ogUrl: z.string().url().optional(),
    twitterCard: z
      .enum(["summary", "summary_large_image", "app", "player"])
      .optional(),
  })
  .strict();

export function parseSeoForm(formData: FormData): {
  data?: z.infer<typeof seoSchema>;
  errors?: Record<string, string[]>;
} {
  const parsed = seoSchema.safeParse(
    Object.fromEntries(
      formData as unknown as Iterable<[string, FormDataEntryValue]>
    )
  );
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

const generateSchema = z
  .object({
    id: z.string().min(1),
    locale: localeSchema,
    title: z.string().min(1),
    description: z.string().min(1),
  })
  .strict();

export function parseGenerateSeoForm(formData: FormData): {
  data?: z.infer<typeof generateSchema>;
  errors?: Record<string, string[]>;
} {
  const parsed = generateSchema.safeParse(
    Object.fromEntries(
      formData as unknown as Iterable<[string, FormDataEntryValue]>
    )
  );
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

const currencyTaxSchema = z
  .object({
    currency: z.string().length(3, "Required"),
    taxRegion: z.string().min(1, "Required"),
  })
  .strict();

export function parseCurrencyTaxForm(formData: FormData): {
  data?: z.infer<typeof currencyTaxSchema>;
  errors?: Record<string, string[]>;
} {
  const parsed = currencyTaxSchema.safeParse(
    Object.fromEntries(formData as unknown as Iterable<[string, FormDataEntryValue]>)
  );
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

const depositSchema = z
  .object({
    enabled: z.preprocess((v) => v === "on", z.boolean()),
    intervalMinutes: z.coerce.number().int().min(1, "Must be at least 1"),
  })
  .strict();

export function parseDepositForm(formData: FormData): {
  data?: z.infer<typeof depositSchema>;
  errors?: Record<string, string[]>;
} {
  const parsed = depositSchema.safeParse(
    Object.fromEntries(formData as unknown as Iterable<[string, FormDataEntryValue]>)
  );
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

const reverseLogisticsSchema = z
  .object({
    enabled: z.preprocess((v) => v === "on", z.boolean()),
    intervalMinutes: z.coerce.number().int().min(1, "Must be at least 1"),
  })
  .strict();

export function parseReverseLogisticsForm(formData: FormData): {
  data?: z.infer<typeof reverseLogisticsSchema>;
  errors?: Record<string, string[]>;
} {
  const parsed = reverseLogisticsSchema.safeParse(
    Object.fromEntries(formData as unknown as Iterable<[string, FormDataEntryValue]>)
  );
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

const returnsSchema = z
  .object({ enabled: z.preprocess((v) => v === "on", z.boolean()) })
  .strict();

export function parseUpsReturnsForm(formData: FormData): {
  data?: z.infer<typeof returnsSchema>;
  errors?: Record<string, string[]>;
} {
  const parsed = returnsSchema.safeParse(
    Object.fromEntries(formData as unknown as Iterable<[string, FormDataEntryValue]>)
  );
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

const premierDeliverySchema = z
  .object({
    regions: z.array(z.string().min(1)).default([]),
    windows: z.array(z.string().regex(/^\d{2}-\d{2}$/)).default([]),
  })
  .strict();

export function parsePremierDeliveryForm(formData: FormData): {
  data?: z.infer<typeof premierDeliverySchema>;
  errors?: Record<string, string[]>;
} {
  const data = {
    regions: formData
      .getAll("regions")
      .map(String)
      .map((v) => v.trim())
      .filter(Boolean),
    windows: formData
      .getAll("windows")
      .map(String)
      .map((v) => v.trim())
      .filter(Boolean),
  };
  const parsed = premierDeliverySchema.safeParse(data);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

const aiCatalogFormSchema = z
  .object({
    enabled: z.preprocess((v) => v === "on", z.boolean()),
    pageSize: z.coerce.number().int().positive(),
    fields: z.array(aiCatalogFieldSchema),
  })
  .strict();

export function parseAiCatalogForm(formData: FormData): {
  data?: z.infer<typeof aiCatalogFormSchema>;
  errors?: Record<string, string[]>;
} {
  const data = {
    enabled: formData.get("enabled"),
    pageSize: formData.get("pageSize"),
    fields: formData.getAll("fields"),
  };
  const parsed = aiCatalogFormSchema.safeParse(data);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }
  return { data: parsed.data };
}

export type SeoForm = z.infer<typeof seoSchema> & { locale: Locale; };
export type GenerateSeoForm = z.infer<typeof generateSchema>;
export type CurrencyTaxForm = z.infer<typeof currencyTaxSchema>;
export type DepositForm = z.infer<typeof depositSchema>;
export type ReverseLogisticsForm = z.infer<typeof reverseLogisticsSchema>;
export type UpsReturnsForm = z.infer<typeof returnsSchema>;
export type PremierDeliveryForm = z.infer<typeof premierDeliverySchema>;
export type AiCatalogForm = z.infer<typeof aiCatalogFormSchema>;
