import nodemailer from "nodemailer";
import sanitizeHtml from "sanitize-html";
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
  /** Skip HTML sanitization for trusted templates */
  skipSanitization?: boolean;
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
  const { skipSanitization, ...emailOptions } = options;
  const sanitizedOptions = {
    ...emailOptions,
    html: skipSanitization
      ? emailOptions.html
      : sanitizeHtml(emailOptions.html),
  };

  const provider = providers[coreEnv.EMAIL_PROVIDER ?? ""];
  if (provider) {
    await provider.send(sanitizedOptions);
    return;
  }

  const transport = nodemailer.createTransport({
    url: coreEnv.SMTP_URL,
  });

  await transport.sendMail({
    from: coreEnv.CAMPAIGN_FROM || "no-reply@example.com",
    ...sanitizedOptions,
  });
}
