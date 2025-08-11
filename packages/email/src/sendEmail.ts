// packages/lib/src/email.ts

import { env } from "@config/src/env";
import nodemailer from "nodemailer";

const hasCreds = env.GMAIL_USER && env.GMAIL_PASS;

const transporter = hasCreds
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.GMAIL_USER,
        pass: env.GMAIL_PASS,
      },
    })
  : null;

export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<void> {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: env.GMAIL_USER,
        to,
        subject,
        text: body,
      });
    } catch (error) {
      console.error("Error sending email", error);
      throw error;
    }
  } else {
    console.log("Email to", to, "|", subject, "|", body);
  }
}
