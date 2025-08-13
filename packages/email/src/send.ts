import nodemailer from "nodemailer";
import { coreEnv } from "@acme/config/env/core";
import { SendgridProvider } from "./providers/sendgrid";
import { ResendProvider } from "./providers/resend";
import type { CampaignProvider } from "./providers/types";
import { defaultFrom } from "./config";

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

const providers: Record<string, CampaignProvider> = {
  sendgrid: new SendgridProvider(),
  resend: new ResendProvider(),
};

/**
 * Send a campaign email using the configured provider.
 * Falls back to Nodemailer when EMAIL_PROVIDER is unset or unrecognized.
 */
export async function sendCampaignEmail(
  options: CampaignOptions
): Promise<void> {
  const provider = providers[coreEnv.EMAIL_PROVIDER ?? ""];
  if (provider) {
    await provider.send(options);
    return;
  }

  const transport = nodemailer.createTransport({
    url: coreEnv.SMTP_URL,
  });

  await transport.sendMail({
    from: defaultFrom,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}
