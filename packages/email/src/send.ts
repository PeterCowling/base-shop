import nodemailer from "nodemailer";
import { coreEnv } from "@acme/config/env/core";
import { SendgridProvider } from "./providers/sendgrid";
import { ResendProvider } from "./providers/resend";
import type { CampaignProvider } from "./providers/types";
import { renderTemplate } from "./templates";

export interface CampaignOptions {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject?: string;
  /** HTML body */
  html?: string;
  /** Optional plain-text body */
  text?: string;
  /** Optional template to render */
  templateId?: string;
  /** Variables for template rendering */
  variables?: Record<string, string>;
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
  let finalOptions = options;
  if (options.templateId) {
    const rendered = renderTemplate(options.templateId, options.variables ?? {});
    finalOptions = { ...options, ...rendered };
  }

  const { templateId: _t, variables: _v, ...sendOptions } = finalOptions;

  const provider = providers[coreEnv.EMAIL_PROVIDER ?? ""];
  if (provider) {
    await provider.send(sendOptions as CampaignOptions);
    return;
  }

  const transport = nodemailer.createTransport({
    url: coreEnv.SMTP_URL,
  });

  await transport.sendMail({
    from: coreEnv.CAMPAIGN_FROM || "no-reply@example.com",
    to: sendOptions.to,
    subject: sendOptions.subject!,
    html: sendOptions.html!,
    text: sendOptions.text,
  });
}
