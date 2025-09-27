import "@acme/zod-utils/initZod";
import { z } from "zod";

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
      .refine((v) => !Number.isNaN(Number(v)), { message: "must be a number" }) // i18n-exempt: validation copy (non-UI)
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
    EMAIL_PROVIDER: z.enum(["sendgrid", "resend", "smtp", "noop"]).default("smtp"),
    SENDGRID_API_KEY: z.string().optional(),
    SENDGRID_MARKETING_KEY: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
    EMAIL_BATCH_SIZE: z.coerce.number().optional(),
    EMAIL_BATCH_DELAY_MS: z.coerce.number().optional(),
  })
  .superRefine((env, ctx) => {
    // Require EMAIL_FROM whenever a real provider is selected, in all envs.
    if (env.EMAIL_PROVIDER !== "noop" && !env.EMAIL_FROM) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["EMAIL_FROM"], message: "Required" }); // i18n-exempt: validation copy (non-UI)
    }
    if (env.EMAIL_PROVIDER === "sendgrid" && !env.SENDGRID_API_KEY) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["SENDGRID_API_KEY"], message: "Required" }); // i18n-exempt: validation copy (non-UI)
    }
    if (env.EMAIL_PROVIDER === "resend" && !env.RESEND_API_KEY) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["RESEND_API_KEY"], message: "Required" }); // i18n-exempt: validation copy (non-UI)
    }
  });

export type EmailEnv = z.infer<typeof emailEnvSchema>;
