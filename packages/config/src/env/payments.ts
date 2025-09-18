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
    .refine((val) => /^[A-Z]{3}$/.test(val), {
      message: "PAYMENTS_CURRENCY must be a 3-letter uppercase currency code",
    }),
  STRIPE_SECRET_KEY: z.string().min(1).default("sk_test"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1)
    .default("pk_test"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).default("whsec_test"),
});

export type PaymentsEnv = z.infer<typeof paymentsEnvSchema>;

export function loadPaymentsEnv(
  raw: NodeJS.ProcessEnv = process.env,
): PaymentsEnv {
  if (raw.PAYMENTS_GATEWAY === "disabled") {
    return paymentsEnvSchema.parse({});
  }

  if (
    raw.PAYMENTS_PROVIDER &&
    raw.PAYMENTS_PROVIDER !== "stripe"
  ) {
    console.error(
      "❌ Unsupported PAYMENTS_PROVIDER:",
      raw.PAYMENTS_PROVIDER,
    );
    throw new Error("Invalid payments environment variables");
  }

  if (raw.PAYMENTS_PROVIDER === "stripe") {
    if (!raw.STRIPE_SECRET_KEY) {
      console.error(
        "❌ Missing STRIPE_SECRET_KEY when PAYMENTS_PROVIDER=stripe",
      );
      throw new Error("Invalid payments environment variables");
    }
    if (!raw.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      console.error(
        "❌ Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY when PAYMENTS_PROVIDER=stripe",
      );
      throw new Error("Invalid payments environment variables");
    }
    if (!raw.STRIPE_WEBHOOK_SECRET) {
      console.error(
        "❌ Missing STRIPE_WEBHOOK_SECRET when PAYMENTS_PROVIDER=stripe",
      );
      throw new Error("Invalid payments environment variables");
    }
  }

  const parsed = paymentsEnvSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn(
      "⚠️ Invalid payments environment variables:",
      parsed.error.format(),
    );
    return paymentsEnvSchema.parse({});
  }

  return parsed.data;
}

export const paymentsEnv = loadPaymentsEnv();
