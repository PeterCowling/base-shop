import nodemailer from "nodemailer";
import { coreEnv } from "@acme/config/env/core";
import { SendgridProvider } from "./providers/sendgrid";
import { ResendProvider } from "./providers/resend";
import type { CampaignProvider } from "./providers/types";

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

function ensureText(
  options: CampaignOptions
): CampaignOptions & { text: string } {
  if (options.text) {
    return options as CampaignOptions & { text: string };
  }

  const text = options.html
    .replace(/<br\s*\/?>(\n)?/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { ...options, text };
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
  const payload = ensureText(options);
  const provider = providers[coreEnv.EMAIL_PROVIDER ?? ""];
  if (provider) {
    await provider.send(payload);
    return;
  }

  const transport = nodemailer.createTransport({
    url: coreEnv.SMTP_URL,
  });

  await transport.sendMail({
    from: coreEnv.CAMPAIGN_FROM || "no-reply@example.com",
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    text: payload.text,
  });
}
