import nodemailer from "nodemailer";
import { coreEnv } from "@acme/config/env/core";
import { getDefaultSender } from "./config";
import { SendgridProvider } from "./providers/sendgrid";
import { ResendProvider } from "./providers/resend";
import type { CampaignProvider } from "./providers/types";
import { ProviderError } from "./providers/types";
import { renderTemplate } from "./templates";

export interface CampaignOptions {
  /** Recipient email address */
  to: string;
  /** Email subject line */
  subject: string;
  /** HTML body */
  html?: string;
  /** Optional plain-text body */
  text?: string;
  /** Optional campaign identifier for logging */
  campaignId?: string;
  /** Optional template identifier */
  templateId?: string;
  /** Variables to substitute into the template */
  variables?: Record<string, string>;
}

function deriveText(html: string): string {
  return html
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function ensureText(options: CampaignOptions): CampaignOptions {
  if (!options.html) {
    throw new Error("Missing html content for campaign email");
  }
  if (options.text) return options;
  return { ...options, text: deriveText(options.html) };
}

const providers: Record<string, CampaignProvider> = {
  sendgrid: new SendgridProvider(),
  resend: new ResendProvider(),
};

const availableProviders = [...Object.keys(providers), "smtp"];

if (!coreEnv.EMAIL_PROVIDER) {
  console.error(
    `EMAIL_PROVIDER is not set. Available providers: ${availableProviders.join(", ")}`
  );
} else if (!availableProviders.includes(coreEnv.EMAIL_PROVIDER)) {
  throw new Error(
    `Unsupported EMAIL_PROVIDER "${coreEnv.EMAIL_PROVIDER}". Available providers: ${availableProviders.join(", ")}`
  );
}

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
  let opts = { ...options };
  if (opts.templateId) {
    opts.html = renderTemplate(opts.templateId, opts.variables ?? {});
  }
  const optsWithText = ensureText(opts);
  const primary = coreEnv.EMAIL_PROVIDER ?? "";
  const provider = providers[primary];

  // No configured provider – use Nodemailer directly
  if (!provider) {
    await sendWithNodemailer(optsWithText);
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
      await sendWithRetry(current, optsWithText);
      return;
    } catch (err) {
      console.error("Campaign email send failed", {
        provider: name,
        recipient: optsWithText.to,
        campaignId: optsWithText.campaignId,
        error: err,
      });
      // Try next provider
    }
  }

  await sendWithNodemailer(optsWithText);
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
          : ((err as any)?.retryable ?? true);
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
    from: getDefaultSender(),
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}
