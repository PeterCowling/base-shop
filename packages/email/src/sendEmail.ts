// packages/email/src/sendEmail.ts

import "server-only";
import nodemailer from "nodemailer";
import pino from "pino";
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

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: getDefaultSender(),
        to,
        subject,
        text: body,
      });
    } catch (error) {
      console.error("Error sending email", error);
      throw error;
    }
  } else {
    logger.info({ to }, "Email simulated");
  }
}
