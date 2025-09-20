// Central mock for @acme/config/env/shipping
import { z } from "zod";
export type TestShippingEnv = {
  TAXJAR_KEY?: string;
  UPS_KEY?: string;
  DHL_KEY?: string;
  SHIPPING_PROVIDER?: "none" | "external" | "shippo" | "ups" | "dhl";
  ALLOWED_COUNTRIES?: string[];
  LOCAL_PICKUP_ENABLED?: boolean;
  DEFAULT_COUNTRY?: string;
  DEFAULT_SHIPPING_ZONE?: "domestic" | "eu" | "international";
  FREE_SHIPPING_THRESHOLD?: number;
};

let overrides: Partial<TestShippingEnv> = Object.create(null);

export function __setShippingEnv(over: Partial<TestShippingEnv>): void {
  overrides = { ...overrides, ...over };
}

export function __resetShippingEnv(): void {
  overrides = Object.create(null);
}

function parseBool(v: unknown): boolean | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  if (/^(true|1|yes)$/i.test(s)) return true;
  if (/^(false|0|no)$/i.test(s)) return false;
  return undefined;
}

function computeShippingEnvFrom(raw: NodeJS.ProcessEnv): TestShippingEnv {
  const zone = raw.DEFAULT_SHIPPING_ZONE as string | undefined;
  const validZone = zone && ["domestic", "eu", "international"].includes(zone) ? (zone as any) : undefined;
  const countries = typeof raw.ALLOWED_COUNTRIES === "string"
    ? raw.ALLOWED_COUNTRIES.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean)
    : undefined;
  const defaultCountry = typeof raw.DEFAULT_COUNTRY === "string"
    ? raw.DEFAULT_COUNTRY.trim().toUpperCase() || undefined
    : undefined;
  const threshold = raw.FREE_SHIPPING_THRESHOLD == null
    ? undefined
    : (Number(raw.FREE_SHIPPING_THRESHOLD));

  const env: TestShippingEnv = {
    SHIPPING_PROVIDER: (raw.SHIPPING_PROVIDER as any) ?? "none",
    ALLOWED_COUNTRIES: countries,
    LOCAL_PICKUP_ENABLED: parseBool(raw.LOCAL_PICKUP_ENABLED),
    DEFAULT_COUNTRY: defaultCountry,
    DEFAULT_SHIPPING_ZONE: validZone,
    FREE_SHIPPING_THRESHOLD: Number.isFinite(threshold) && threshold! >= 0 ? threshold : undefined,
    TAXJAR_KEY: raw.TAXJAR_KEY,
    UPS_KEY: raw.UPS_KEY,
    DHL_KEY: raw.DHL_KEY,
  };
  return Object.assign(Object.create(null), env, overrides);
}

function computeShippingEnv(): TestShippingEnv {
  return computeShippingEnvFrom(process.env as NodeJS.ProcessEnv);
}

export function loadShippingEnv(raw: NodeJS.ProcessEnv = process.env as NodeJS.ProcessEnv): TestShippingEnv {
  // Validate critical fields similarly to real module
  const zone = raw.DEFAULT_SHIPPING_ZONE as string | undefined;
  if (typeof zone === "string" && !["domestic", "eu", "international"].includes(zone)) {
    throw new Error("Invalid shipping environment variables");
  }
  const fst = raw.FREE_SHIPPING_THRESHOLD as unknown;
  if (typeof fst !== "undefined") {
    const n = Number(fst);
    if (!Number.isFinite(n) || n < 0) {
      throw new Error("Invalid shipping environment variables");
    }
  }
  const lpe = raw.LOCAL_PICKUP_ENABLED as unknown;
  if (typeof lpe !== "undefined") {
    const parsed = parseBool(lpe);
    if (typeof parsed === "undefined") {
      throw new Error("Invalid shipping environment variables");
    }
  }
  const provider = (raw.SHIPPING_PROVIDER || "").toString().toLowerCase();
  if (provider === "ups") {
    const hasKey = typeof raw.UPS_KEY === "string" && raw.UPS_KEY.trim() !== "";
    if (!hasKey) {
      throw new Error("Invalid shipping environment variables");
    }
  }
  if (provider === "dhl") {
    const hasKey = typeof raw.DHL_KEY === "string" && raw.DHL_KEY.trim() !== "";
    if (!hasKey) {
      throw new Error("Invalid shipping environment variables");
    }
  }
  return computeShippingEnvFrom(raw);
}

export const shippingEnv: TestShippingEnv = new Proxy({} as TestShippingEnv, {
  get: (_t, prop: string) => (computeShippingEnv() as any)[prop],
  has: (_t, prop: string) => prop in computeShippingEnv(),
  ownKeys: () => Reflect.ownKeys(computeShippingEnv()),
  getOwnPropertyDescriptor: (_t, prop: string | symbol) =>
    Object.getOwnPropertyDescriptor(computeShippingEnv(), prop),
});

// Provide a lightweight schema so code that merges `.innerType()` keeps working
export const shippingEnvSchema = z
  .object({
    TAXJAR_KEY: z.string().optional(),
    UPS_KEY: z.string().optional(),
    DHL_KEY: z.string().optional(),
    SHIPPING_PROVIDER: z
      .enum(["none", "external", "shippo", "ups", "dhl"]).optional(),
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
      .preprocess((v) => (v == null ? undefined : String(v)), z.string().optional())
      .refine(
        (v) => v === undefined || /^(true|false|1|0|yes|no)$/i.test(v.trim()),
        { message: "must be a boolean" },
      )
      .transform((v) => (v === undefined ? undefined : /^(true|1|yes)$/i.test(v.trim()))),
    DEFAULT_COUNTRY: z
      .preprocess((v) => {
        if (typeof v !== "string") return undefined;
        const s = v.trim();
        return s === "" ? undefined : s.toUpperCase();
      }, z.string().optional())
      .refine((v) => v === undefined || /^[A-Z]{2}$/.test(v), {
        message: "must be a 2-letter country code",
      }),
    DEFAULT_SHIPPING_ZONE: z
      .enum(["domestic", "eu", "international"]).optional(),
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
        message: "UPS_KEY is required when SHIPPING_PROVIDER=ups",
      });
    }
    if (env.SHIPPING_PROVIDER === "dhl" && !env.DHL_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["DHL_KEY"],
        message: "DHL_KEY is required when SHIPPING_PROVIDER=dhl",
      });
    }
  });

export default {} as unknown as never;

// Eager validation for API tests expecting import to fail on invalid env
(() => {
  const provider = (process.env.SHIPPING_PROVIDER || "").toLowerCase();
  const zone = process.env.DEFAULT_SHIPPING_ZONE;
  if (typeof zone === "string" && !["domestic", "eu", "international"].includes(zone)) {
    throw new Error("Invalid shipping environment variables");
  }
  if (provider === "ups") {
    const hasKey = typeof process.env.UPS_KEY === "string" && process.env.UPS_KEY.trim() !== "";
    if (!hasKey) {
      // Match real module behavior/messages used in tests
      // console.error is intentionally omitted here; API tests stub console.error
      throw new Error("Invalid shipping environment variables");
    }
  }
  if (provider === "dhl") {
    const hasKey = typeof process.env.DHL_KEY === "string" && process.env.DHL_KEY.trim() !== "";
    if (!hasKey) {
      throw new Error("Invalid shipping environment variables");
    }
  }
})();
