// packages/email/src/sendEmail.ts

import "server-only";
import nodemailer from "nodemailer";
import pino from "pino";
import { z } from "zod";
import { getDefaultSender } from "./config";

type MailTransporter = {
  sendMail: (options: Record<string, unknown>) => Promise<{ messageId?: string }>;
} | null;

let cachedTransporter: MailTransporter = null;
let cachedCredsKey: string | null = null;
let cachedLogger: pino.Logger | null = null;
let cachedLoggerLevel: string | undefined;

function resolveCredentials(): { user: string; pass: string } | null {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_PASS?.trim();
  if (!user || !pass) {
    cachedTransporter = null;
    cachedCredsKey = null;
    return null;
  }
  return { user, pass };
}

function getTransporter(): MailTransporter {
  const creds = resolveCredentials();
  if (!creds) {
    return null;
  }

  const key = `${creds.user}:${creds.pass}`;
  if (!cachedTransporter || cachedCredsKey !== key) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: creds.user,
        pass: creds.pass,
      },
    });
    cachedCredsKey = key;
  }

  return cachedTransporter;
}

function getLogger(): pino.Logger {
  const level = process.env.EMAIL_LOG_LEVEL ?? "silent";
  if (!cachedLogger || cachedLoggerLevel !== level) {
    cachedLogger = pino({ level });
    cachedLoggerLevel = level;
  }
  return cachedLogger;
}

// Initialize transporter once at module load so credentialed environments
// behave consistently with legacy eager instantiation.
getTransporter();

const emailSchema = z.object({
  to: z.string().email({ message: "Invalid recipient email address" }), // i18n-exempt: developer validation error
  subject: z.string().min(1, { message: "Email subject is required" }), // i18n-exempt: developer validation error
  body: z.string().min(1, { message: "Email body is required" }), // i18n-exempt: developer validation error
  attachments: z.array(z.any()).optional(),
});

export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  attachments?: unknown
): Promise<string | undefined> {
  const validated = emailSchema.parse({ to, subject, body, attachments });

  const transporter = getTransporter();
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: getDefaultSender(),
        to: validated.to,
        subject: validated.subject,
        text: validated.body,
        attachments: validated.attachments,
      });
      return info?.messageId;
    } catch (error) {
      getLogger().error({ error }, "Error sending email"); // i18n-exempt: operational log
      throw error;
    }
  } else {
    getLogger().info({ to: validated.to }, "Email simulated"); // i18n-exempt: operational log
  }
  return undefined;
}
