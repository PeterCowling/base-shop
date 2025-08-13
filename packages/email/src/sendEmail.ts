// packages/email/src/sendEmail.ts

import { coreEnv } from "@acme/config/env/core";
import nodemailer from "nodemailer";
import { getDefaultSender } from "./config";

const hasCreds = coreEnv.GMAIL_USER && coreEnv.GMAIL_PASS;

const transporter = hasCreds
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: coreEnv.GMAIL_USER,
        pass: coreEnv.GMAIL_PASS,
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
    console.log("Email to", to, "|", subject, "|", body);
  }
}
