import nodemailer from "nodemailer";
import { coreEnv } from "@acme/config/env/core";
import { SendgridProvider } from "./providers/sendgrid";
import { ResendProvider } from "./providers/resend";
import type { CampaignProvider } from "./providers/types";
import { logEmailError } from "./logging";

export interface CampaignOptions {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** HTML body */
  html: string;
  /** Optional plain-text body */
  text?: string;
  /** Optional campaign identifier */
  campaignId?: string;
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

  try {
    await transport.sendMail({
      from: coreEnv.CAMPAIGN_FROM || "no-reply@example.com",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  } catch (err) {
    await logEmailError(err, {
      campaignId: options.campaignId,
      to: options.to,
      provider: "smtp",
    });
    throw err;
  }
}
