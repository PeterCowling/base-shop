// packages/config/src/env/payments.ts
import "@acme/zod-utils/initZod";
import { z } from "zod";

const currencyCode = z
  .string()
  .transform((v) => v.toUpperCase())
  .refine((v) => /^[A-Z]{3}$/.test(v), {
    message: "invalid currency code",
  });

export const paymentsEnvSchema = z
  .object({
    PAYMENTS_PROVIDER: z.enum(["none", "stripe"]).default("none"),
    PAYMENTS_SANDBOX: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .default("true"),
    NEXT_PUBLIC_CURRENCY: currencyCode.default("USD"),
    STRIPE_SECRET_KEY: z.string().min(1).default("sk_test"),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).default("pk_test"),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).default("whsec_test"),
  })
  .superRefine((env, ctx) => {
    if (env.PAYMENTS_PROVIDER === "stripe") {
      if (!env.STRIPE_SECRET_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["STRIPE_SECRET_KEY"],
          message: "STRIPE_SECRET_KEY is required when PAYMENTS_PROVIDER=stripe",
        });
      }
      if (!env.STRIPE_WEBHOOK_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["STRIPE_WEBHOOK_SECRET"],
          message:
            "STRIPE_WEBHOOK_SECRET is required when PAYMENTS_PROVIDER=stripe",
        });
      }
    }
  });

export type PaymentsEnv = z.infer<typeof paymentsEnvSchema>;

export function loadPaymentsEnv(
  raw: NodeJS.ProcessEnv = process.env,
): PaymentsEnv {
  const parsed = paymentsEnvSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(
      "❌ Invalid payments environment variables:",
      parsed.error.format(),
    );
    throw new Error("Invalid payments environment variables");
  }
  return parsed.data;
}

const parsed = paymentsEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid payments environment variables:",
    parsed.error.format(),
  );
  throw new Error("Invalid payments environment variables");
}

export const paymentsEnv = parsed.data;

