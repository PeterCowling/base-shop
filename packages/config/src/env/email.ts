import "@acme/zod-utils/initZod";
import { z } from "zod";

export const emailEnvSchema = z
  .object({
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
      .refine((v) => v === "true" || v === "false", {
        message: "must be true or false",
      })
      .transform((v) => v === "true")
      .optional(),
    CAMPAIGN_FROM: z
      .string()
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

const parsed = emailEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid email environment variables:",
    parsed.error.format()
  );
  throw new Error("Invalid email environment variables");
}

export const emailEnv = parsed.data;
export type EmailEnv = z.infer<typeof emailEnvSchema>;
