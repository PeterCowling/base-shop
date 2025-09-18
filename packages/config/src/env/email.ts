import "@acme/zod-utils/initZod";
import { z } from "zod";

const hasEmailProvider =
  typeof process.env.EMAIL_PROVIDER === "string" &&
  process.env.EMAIL_PROVIDER.trim().length > 0;
const normalizedNodeEnv =
  typeof process.env.NODE_ENV === "string"
    ? process.env.NODE_ENV.trim().toLowerCase()
    : undefined;
const defaultEmailProvider =
  normalizedNodeEnv === "production" ? "smtp" : "noop";

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
        message: "must be a number",
      })
      .transform((v) => Number(v))
      .optional(),
    SMTP_SECURE: z
      .string()
      .transform((v) => v.trim().toLowerCase())
      .refine((v) => ["true", "false", "1", "0", "yes", "no"].includes(v), {
        message: "must be a boolean",
      })
      .transform((v) => ["true", "1", "yes"].includes(v))
      .optional(),
    CAMPAIGN_FROM: z
      .string()
      .trim()
      .email()
      .transform((v) => v.toLowerCase())
      .optional(),
    EMAIL_PROVIDER: z.enum(["sendgrid", "resend", "smtp", "noop"]).default("noop"),
    SENDGRID_API_KEY: z.string().optional(),
    SENDGRID_MARKETING_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_BATCH_SIZE: z.coerce.number().optional(),
    EMAIL_BATCH_DELAY_MS: z.coerce.number().optional(),
  })
  .superRefine((env, ctx) => {
    if (env.EMAIL_PROVIDER !== "noop" && !env.EMAIL_FROM) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["EMAIL_FROM"],
        message: "Required",
      });
    }
    if (env.EMAIL_PROVIDER === "sendgrid" && !env.SENDGRID_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SENDGRID_API_KEY"],
        message: "Required",
      });
    }
    if (env.EMAIL_PROVIDER === "resend" && !env.RESEND_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["RESEND_API_KEY"],
        message: "Required",
      });
    }
  });
const rawEnv: NodeJS.ProcessEnv = {
  ...process.env,
  EMAIL_PROVIDER: hasEmailProvider
    ? process.env.EMAIL_PROVIDER
    : defaultEmailProvider,
};
const parsed = emailEnvSchema.safeParse(rawEnv);

if (!parsed.success) {
  const formattedError = parsed.error.format();
  console.error("❌ Invalid email environment variables:", formattedError);
  throw new Error("Invalid email environment variables");
}

export const emailEnv = parsed.data;
export type EmailEnv = z.infer<typeof emailEnvSchema>;
