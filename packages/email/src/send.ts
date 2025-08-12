import nodemailer from "nodemailer";
import { coreEnv } from "@acme/config/env/core";

export interface CampaignOptions {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** HTML body */
  html: string;
  /** Optional plain-text body */
  text?: string;
}

/**
 * Send a campaign email using Nodemailer. Transport configuration is taken
 * from the SMTP_URL environment variable.
 */
export async function sendCampaignEmail(
  options: CampaignOptions
): Promise<void> {
  const transport = nodemailer.createTransport({
    url: coreEnv.SMTP_URL,
  });

  await transport.sendMail({
    from: coreEnv.CAMPAIGN_FROM || "no-reply@example.com",
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}
