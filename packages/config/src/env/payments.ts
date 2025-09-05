import "@acme/zod-utils/initZod";
import { z } from "zod";

export const paymentsEnvSchema = z.object({
  PAYMENTS_PROVIDER: z.enum(["stripe"]).optional(),
  PAYMENTS_SANDBOX: z
    .string()
    .optional()
    .refine(
      (v) => v == null || /^(true|false|1|0)$/i.test(v),
      {
        message: "PAYMENTS_SANDBOX must be a boolean",
      },
    )
    .transform((v) => (v == null ? true : /^(true|1)$/i.test(v))),
  PAYMENTS_CURRENCY: z
    .string()
    .default("USD")
    .refine((val) => /^[A-Za-z]{3}$/.test(val), {
      message: "PAYMENTS_CURRENCY must be a 3-letter currency code",
    })
    .transform((val) => val.toUpperCase()),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
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

  const env = parsed.data;

  if (env.PAYMENTS_PROVIDER === "stripe") {
    if (!env.STRIPE_SECRET_KEY) {
      console.error("❌ Missing STRIPE_SECRET_KEY when PAYMENTS_PROVIDER=stripe");
      throw new Error("Invalid payments environment variables");
    }
    if (!env.STRIPE_WEBHOOK_SECRET) {
      console.error(
        "❌ Missing STRIPE_WEBHOOK_SECRET when PAYMENTS_PROVIDER=stripe",
      );
      throw new Error("Invalid payments environment variables");
    }
  }

  return env;
}

export const paymentsEnv = loadPaymentsEnv();
