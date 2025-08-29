import "@acme/zod-utils/initZod";
import { z } from "zod";

export const emailEnvSchema = z.object({
  GMAIL_USER: z.string().optional(),
  GMAIL_PASS: z.string().optional(),
  SMTP_URL: z.string().url().optional(),
  CAMPAIGN_FROM: z.string().optional(),
  EMAIL_PROVIDER: z.enum(["sendgrid", "resend", "smtp"]).default("smtp"),
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_MARKETING_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_BATCH_SIZE: z.coerce.number().optional(),
  EMAIL_BATCH_DELAY_MS: z.coerce.number().optional(),
});

const parsed = emailEnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid email environment variables:",
    parsed.error.format(),
  );
  throw new Error("Invalid email environment variables");
}

export const emailEnv = parsed.data;
export type EmailEnv = z.infer<typeof emailEnvSchema>;
