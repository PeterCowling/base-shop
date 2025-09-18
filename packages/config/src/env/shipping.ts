// packages/config/src/env/shipping.ts
import "@acme/zod-utils/initZod";
import { z } from "zod";

const providers = ["none", "external", "shippo", "ups", "dhl"] as const;

export const shippingEnvSchema = z
  .object({
    TAXJAR_KEY: z.string().optional(),
    UPS_KEY: z.string().optional(),
    DHL_KEY: z.string().optional(),
    SHIPPING_PROVIDER: z.enum(providers).optional(),
    ALLOWED_COUNTRIES: z
      .string()
      .optional()
      .transform((val) =>
      val
        ? val
            .split(",")
            .map((c) => c.trim().toUpperCase())
            .filter(Boolean)
        : undefined,
    ),
  LOCAL_PICKUP_ENABLED: z
    .string()
    .optional()
    .refine(
      (v) =>
        v == null
          ? true
          : /^(true|false|1|0|yes|no)$/i.test(v.trim()),
      {
        message: "must be a boolean",
      },
    )
    .transform((v) =>
      v == null ? undefined : /^(true|1|yes)$/i.test(v.trim()),
    ),
  DEFAULT_COUNTRY: z
    .string()
    .optional()
    .refine((v) =>
      v == null ? true : /^[A-Za-z]{2}$/.test(v.trim()),
    {
      message: "must be a 2-letter country code",
    })
    .transform((v) => (v == null ? undefined : v.trim().toUpperCase())),
  DEFAULT_SHIPPING_ZONE: z
    .enum(["domestic", "eu", "international"])
    .optional(),
  FREE_SHIPPING_THRESHOLD: z.coerce.number().nonnegative().optional(),
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

// ---------- loader (new) ----------
export function loadShippingEnv(
  raw: NodeJS.ProcessEnv = process.env
): ShippingEnv {
  const parsed = shippingEnvSchema.safeParse(raw);
  if (!parsed.success) {
    if (process.env.NODE_ENV !== "test") {
      console.error(
        "❌ Invalid shipping environment variables:",
        parsed.error.format()
      );
    }
    throw new Error("Invalid shipping environment variables");
  }
  return parsed.data;
}

// ---------- existing eager parse (kept for back-compat) ----------
const parsed = shippingEnvSchema.safeParse(process.env);
if (!parsed.success) {
  if (process.env.NODE_ENV !== "test") {
    console.error(
      "❌ Invalid shipping environment variables:",
      parsed.error.format()
    );
  }
  throw new Error("Invalid shipping environment variables");
}
export const shippingEnv = parsed.data;

export type ShippingEnv = z.infer<typeof shippingEnvSchema>;
