// packages/config/src/env/shipping.ts
import "@acme/zod-utils/initZod";
import { z } from "zod";

const providers = ["none", "external", "shippo", "ups", "dhl"] as const;

const NON_STRING_KEYS = [
  "TAXJAR_KEY",
  "UPS_KEY",
  "DHL_KEY",
  "SHIPPING_PROVIDER",
  "ALLOWED_COUNTRIES",
  "LOCAL_PICKUP_ENABLED",
  "DEFAULT_COUNTRY",
  "DEFAULT_SHIPPING_ZONE",
  "FREE_SHIPPING_THRESHOLD",
] as const;

const INVALID_ENV_ERROR = "Invalid shipping environment variables"; // i18n-exempt: developer error
const NON_STRING_ENV_SYMBOL = Symbol.for("acme.config.nonStringEnv");

function assertStringEnv(raw: NodeJS.ProcessEnv): void {
  const invalidKeys = new Set<string>();

  const flagged = Reflect.get(raw, NON_STRING_ENV_SYMBOL) as unknown;
  const globalFlagged = (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__;

  const candidates: unknown[] = [];
  if (Array.isArray(flagged)) {
    candidates.push(...flagged);
  }
  if (Array.isArray(globalFlagged)) {
    candidates.push(...globalFlagged);
  }

  for (const key of candidates) {
    if (typeof key === "string" && NON_STRING_KEYS.includes(key as typeof NON_STRING_KEYS[number])) {
      invalidKeys.add(key);
    }
  }

  for (const key of NON_STRING_KEYS) {
    const value = raw[key];
    if (typeof value !== "string" && typeof value !== "undefined") {
      invalidKeys.add(key);
    }
  }

  if (invalidKeys.size === 0) {
    return;
  }

  const formatted: Record<string, unknown> = { _errors: [] };
  for (const key of invalidKeys) {
    formatted[key] = { _errors: ["Expected string"] }; // i18n-exempt: validation copy (non-UI)
  }
  console.error("❌ Invalid shipping environment variables:", formatted); // i18n-exempt: developer log
  throw new Error(INVALID_ENV_ERROR); // i18n-exempt: developer error
}

export const shippingEnvSchema = z
  .object({
    TAXJAR_KEY: z.string().optional(),
    UPS_KEY: z.string().optional(),
    DHL_KEY: z.string().optional(),
    SHIPPING_PROVIDER: z.enum(providers).optional(),
    ALLOWED_COUNTRIES: z
      .preprocess((val) => {
        if (typeof val !== "string") return undefined;
        const items = val
          .split(",")
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean);
        return items.length > 0 ? items : undefined;
      }, z.array(z.string()).optional()),
    LOCAL_PICKUP_ENABLED: z
      .preprocess((v) => (v == null ? undefined : v), z.string().optional())
      .refine(
        (v) =>
          v === undefined || /^(true|false|1|0|yes|no)$/i.test(v.trim()),
        { message: "must be a boolean" }, // i18n-exempt: validation copy (non-UI)
      )
      .transform((v) =>
        v === undefined ? undefined : /^(true|1|yes)$/i.test(v.trim()),
      ),
    DEFAULT_COUNTRY: z
      .preprocess((v) => {
        if (typeof v !== "string") return undefined;
        const s = v.trim();
        return s === "" ? undefined : s.toUpperCase();
      }, z.string().optional())
      .refine((v) => v === undefined || /^[A-Z]{2}$/.test(v), {
        message: "must be a 2-letter country code", // i18n-exempt: validation copy (non-UI)
      }),
    DEFAULT_SHIPPING_ZONE: z
      .enum(["domestic", "eu", "international"])
      .optional(),
    FREE_SHIPPING_THRESHOLD: z
      .preprocess((v) => {
        if (v == null) return undefined;
        const n = Number(v);
        return Number.isFinite(n) ? n : v;
      }, z.number().nonnegative().optional()),
  })
  .superRefine((env, ctx) => {
    if (env.SHIPPING_PROVIDER === "ups" && !env.UPS_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["UPS_KEY"],
        message: "UPS_KEY is required when SHIPPING_PROVIDER=ups", // i18n-exempt: validation copy (non-UI)
      });
    }
    if (env.SHIPPING_PROVIDER === "dhl" && !env.DHL_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DHL_KEY"],
        message: "DHL_KEY is required when SHIPPING_PROVIDER=dhl", // i18n-exempt: validation copy (non-UI)
      });
    }
  });

// ---------- loader (new) ----------
export function loadShippingEnv(raw?: NodeJS.ProcessEnv): ShippingEnv {
  const effective = raw ?? process.env;
  assertStringEnv(effective);
  const parsed = shippingEnvSchema.safeParse(effective);
  if (!parsed.success) {
    console.error(
      "❌ Invalid shipping environment variables:", // i18n-exempt: developer log
      parsed.error.format(),
    ); // i18n-exempt: developer log
    throw new Error(INVALID_ENV_ERROR); // i18n-exempt: developer error
  }
  return parsed.data;
}

// ---------- existing eager parse (kept for back-compat) ----------
assertStringEnv(process.env);
const parsed = shippingEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid shipping environment variables:", // i18n-exempt: developer log
    parsed.error.format(),
  ); // i18n-exempt: developer log
  throw new Error(INVALID_ENV_ERROR); // i18n-exempt: developer error
}
export const shippingEnv = parsed.data;

export type ShippingEnv = z.infer<typeof shippingEnvSchema>;
