import "@acme/zod-utils/initZod";
import { z } from "zod";

const nodeEnv = process.env.NODE_ENV;
const isTest = nodeEnv === "test";
const nextPhase = process.env.NEXT_PHASE?.toLowerCase();
const isNextProductionBuildPhase = nextPhase === "phase-production-build";
const isProd = nodeEnv === "production" && !isTest && !isNextProductionBuildPhase;

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
      .refine((v) => !Number.isNaN(Number(v)), { message: "must be a number" })
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
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["EMAIL_FROM"], message: "Required" });
    }
    if (env.EMAIL_PROVIDER === "sendgrid" && !env.SENDGRID_API_KEY) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["SENDGRID_API_KEY"], message: "Required" });
    }
    if (env.EMAIL_PROVIDER === "resend" && !env.RESEND_API_KEY) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["RESEND_API_KEY"], message: "Required" });
    }
  });

export type EmailEnv = z.infer<typeof emailEnvSchema>;

