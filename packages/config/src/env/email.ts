import "@acme/zod-utils/initZod";
import { z } from "zod";

const NON_STRING_KEYS = [
  "EMAIL_FROM",
  "EMAIL_SENDER_NAME",
  "GMAIL_USER",
  "GMAIL_PASS",
  "SMTP_URL",
  "SMTP_PORT",
  "SMTP_SECURE",
  "CAMPAIGN_FROM",
  "EMAIL_PROVIDER",
  "SENDGRID_API_KEY",
  "SENDGRID_MARKETING_KEY",
  "RESEND_API_KEY",
  "EMAIL_BATCH_SIZE",
  "EMAIL_BATCH_DELAY_MS",
] as const;
const NON_STRING_ENV_SYMBOL = Symbol.for("acme.config.nonStringEnv");

function assertStringEnv(raw: NodeJS.ProcessEnv): void {
  const invalidKeys = new Set<string>();
  const flagged = Reflect.get(raw, NON_STRING_ENV_SYMBOL) as unknown;
  const globalFlagged = (globalThis as Record<string, unknown>).__ACME_NON_STRING_ENV__;
  const candidates: unknown[] = [];
  if (Array.isArray(flagged)) candidates.push(...flagged);
  if (Array.isArray(globalFlagged)) candidates.push(...globalFlagged);
  for (const key of candidates) {
    if (typeof key === "string" && NON_STRING_KEYS.includes(key as (typeof NON_STRING_KEYS)[number])) {
      invalidKeys.add(key);
    }
  }
  for (const key of NON_STRING_KEYS) {
    const value = raw[key];
    if (typeof value !== "string" && typeof value !== "undefined") {
      invalidKeys.add(key);
    }
  }
  if (invalidKeys.size === 0) return;
  const formatted: Record<string, unknown> = { _errors: [] };
  for (const key of invalidKeys) {
    formatted[key] = { _errors: ["Expected string"] }; // i18n-exempt: validation copy (non-UI)
  }
  console.error("❌ Invalid email environment variables:", formatted); // i18n-exempt: developer log
  throw new Error("Invalid email environment variables"); // i18n-exempt: developer error
}

const hasEmailProvider =
  typeof process.env.EMAIL_PROVIDER === "string" &&
  process.env.EMAIL_PROVIDER.trim().length > 0;
const defaultEmailProvider = "smtp";

export const emailEnvSchema = z
  .object({
    EMAIL_FROM: z
      .string()
      .trim()
      .email()
      .transform((v) => v.toLowerCase())
      .optional(),
    EMAIL_SENDER_NAME: z.string().optional(),
    GMAIL_USER: z.string().optional(),
    GMAIL_PASS: z.string().optional(),
    SMTP_URL: z.string().url().optional(),
    SMTP_PORT: z
      .string()
      .refine((v) => !Number.isNaN(Number(v)), {
        message: "must be a number", // i18n-exempt: validation copy (non-UI)
      })
      .transform((v) => Number(v))
      .optional(),
    SMTP_SECURE: z
      .string()
      .transform((v) => v.trim().toLowerCase())
      .refine((v) => ["true", "false", "1", "0", "yes", "no"].includes(v), {
        message: "must be a boolean", // i18n-exempt: validation copy (non-UI)
      })
      .transform((v) => ["true", "1", "yes"].includes(v))
      .optional(),
    CAMPAIGN_FROM: z
      .string()
      .trim()
      .email()
      .transform((v) => v.toLowerCase())
      .optional(),
    EMAIL_PROVIDER: z
      .enum(["sendgrid", "resend", "smtp", "noop"])
      .default("smtp"),
    SENDGRID_API_KEY: z.string().optional(),
    SENDGRID_MARKETING_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_BATCH_SIZE: z.coerce.number().optional(),
    EMAIL_BATCH_DELAY_MS: z.coerce.number().optional(),
  })
  .superRefine((env, ctx) => {
    // Require EMAIL_FROM whenever a real provider is selected, in all envs.
    if (env.EMAIL_PROVIDER !== "noop" && !env.EMAIL_FROM) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["EMAIL_FROM"],
        message: "Required", // i18n-exempt: validation copy (non-UI)
      });
    }
    if (env.EMAIL_PROVIDER === "sendgrid" && !env.SENDGRID_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SENDGRID_API_KEY"],
        message: "Required", // i18n-exempt: validation copy (non-UI)
      });
    }
    if (env.EMAIL_PROVIDER === "resend" && !env.RESEND_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["RESEND_API_KEY"],
        message: "Required", // i18n-exempt: validation copy (non-UI)
      });
    }
  });
const rawEnv: NodeJS.ProcessEnv = {
  ...process.env,
  EMAIL_PROVIDER: hasEmailProvider
    ? process.env.EMAIL_PROVIDER
    : defaultEmailProvider,
};
assertStringEnv(rawEnv);
const parsed = emailEnvSchema.safeParse(rawEnv);

if (!parsed.success) {
  const formattedError = parsed.error.format();
  console.error("❌ Invalid email environment variables:", formattedError); // i18n-exempt: developer log
  throw new Error("Invalid email environment variables"); // i18n-exempt: developer error
}

export const emailEnv = parsed.data;
export type EmailEnv = z.infer<typeof emailEnvSchema>;
