// packages/email/src/sendEmail.ts

import "server-only";
import nodemailer from "nodemailer";
import pino from "pino";
import { z } from "zod";
import { getDefaultSender } from "./config";

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_PASS;
const hasCreds = user && pass;

const transporter = hasCreds
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user,
        pass,
      },
    })
  : null;

const logger = pino({
  level: process.env.EMAIL_LOG_LEVEL ?? "silent",
});

const emailSchema = z.object({
  to: z.string().email({ message: "Invalid recipient email address" }),
  subject: z.string().min(1, { message: "Email subject is required" }),
  body: z.string().min(1, { message: "Email body is required" }),
});

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  const validated = emailSchema.parse({ to, subject, body });

  if (transporter) {
    try {
      await transporter.sendMail({
        from: getDefaultSender(),
        to: validated.to,
        subject: validated.subject,
        text: validated.body,
      });
    } catch (error) {
      console.error("Error sending email", error);
      throw error;
    }
  } else {
    logger.info({ to: validated.to }, "Email simulated");
  }
}
