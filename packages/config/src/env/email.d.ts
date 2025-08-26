import "@acme/zod-utils/initZod";
import { z } from "zod";
export declare const emailEnvSchema: z.ZodObject<{
    GMAIL_USER: z.ZodOptional<z.ZodString>;
    GMAIL_PASS: z.ZodOptional<z.ZodString>;
    SMTP_URL: z.ZodOptional<z.ZodString>;
    CAMPAIGN_FROM: z.ZodOptional<z.ZodString>;
    EMAIL_PROVIDER: z.ZodDefault<z.ZodEnum<["sendgrid", "resend", "smtp"]>>;
    SENDGRID_API_KEY: z.ZodOptional<z.ZodString>;
    SENDGRID_MARKETING_KEY: z.ZodOptional<z.ZodString>;
    RESEND_API_KEY: z.ZodOptional<z.ZodString>;
    EMAIL_BATCH_SIZE: z.ZodOptional<z.ZodNumber>;
    EMAIL_BATCH_DELAY_MS: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    EMAIL_PROVIDER: "sendgrid" | "resend" | "smtp";
    GMAIL_USER?: string | undefined;
    GMAIL_PASS?: string | undefined;
    SMTP_URL?: string | undefined;
    CAMPAIGN_FROM?: string | undefined;
    SENDGRID_API_KEY?: string | undefined;
    SENDGRID_MARKETING_KEY?: string | undefined;
    RESEND_API_KEY?: string | undefined;
    EMAIL_BATCH_SIZE?: number | undefined;
    EMAIL_BATCH_DELAY_MS?: number | undefined;
}, {
    GMAIL_USER?: string | undefined;
    GMAIL_PASS?: string | undefined;
    SMTP_URL?: string | undefined;
    CAMPAIGN_FROM?: string | undefined;
    EMAIL_PROVIDER?: "sendgrid" | "resend" | "smtp" | undefined;
    SENDGRID_API_KEY?: string | undefined;
    SENDGRID_MARKETING_KEY?: string | undefined;
    RESEND_API_KEY?: string | undefined;
    EMAIL_BATCH_SIZE?: number | undefined;
    EMAIL_BATCH_DELAY_MS?: number | undefined;
}>;
export declare const emailEnv: {
    EMAIL_PROVIDER: "sendgrid" | "resend" | "smtp";
    GMAIL_USER?: string | undefined;
    GMAIL_PASS?: string | undefined;
    SMTP_URL?: string | undefined;
    CAMPAIGN_FROM?: string | undefined;
    SENDGRID_API_KEY?: string | undefined;
    SENDGRID_MARKETING_KEY?: string | undefined;
    RESEND_API_KEY?: string | undefined;
    EMAIL_BATCH_SIZE?: number | undefined;
    EMAIL_BATCH_DELAY_MS?: number | undefined;
};
export type EmailEnv = z.infer<typeof emailEnvSchema>;
