import nodemailer from "nodemailer";
import sanitizeHtml from "sanitize-html";
import { coreEnv } from "@acme/config/env/core";
import { SendgridProvider } from "./providers/sendgrid";
import { ResendProvider } from "./providers/resend";
import type { CampaignProvider } from "./providers/types";
import { ProviderError } from "./providers/types";

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
 * If the chosen provider fails, alternate providers are attempted. Each
 * provider is retried with exponential backoff when the error is marked as
 * retryable.
 */
export async function sendCampaignEmail(
  options: CampaignOptions
): Promise<void> {
  const { skipSanitization, ...rest } = options;
  const sanitizedOptions: CampaignOptions = {
    ...rest,
    html: skipSanitization ? rest.html : sanitizeHtml(rest.html),
  };

  const primary = coreEnv.EMAIL_PROVIDER ?? "";
  const provider = providers[primary];

  // No configured provider – use Nodemailer directly
  if (!provider) {
    await sendWithNodemailer(sanitizedOptions);
    return;
  }

  const providerOrder = [
    primary,
    ...Object.keys(providers).filter((p) => p !== primary),
  ];

  for (const name of providerOrder) {
    const current = providers[name];
    if (!current) continue;
    try {
      await sendWithRetry(current, sanitizedOptions);
      return;
    } catch {
      // Try next provider
    }
  }

  await sendWithNodemailer(sanitizedOptions);
}

async function sendWithRetry(
  provider: CampaignProvider,
  options: CampaignOptions,
  maxRetries = 3
): Promise<void> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await provider.send(options);
      return;
    } catch (err) {
      attempt++;
      const retryable =
        err instanceof ProviderError
          ? err.retryable
          : (err as any)?.retryable ?? true;
      if (!retryable || attempt >= maxRetries) {
        throw err;
      }
      const delay = 100 * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function sendWithNodemailer(options: CampaignOptions): Promise<void> {
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
