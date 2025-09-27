import "server-only";
import type { CampaignProvider } from "./providers/types";
import { ProviderError } from "./providers/types";
import { hasProviderErrorFields } from "./providers/error";
import { getDefaultSender } from "./config";
import { emailSchema, subjectSchema } from "./validators";
import { prepareContent } from "./content";
import { getProviderOrder, loadProvider } from "./providers";

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
  /** Sanitize HTML content before sending. Defaults to true. */
  sanitize?: boolean;
}

// Provider selection reads `process.env` at call time so tests or runtime code
// that mutate environment variables after the configuration module has loaded
// can still influence the chosen provider without throwing on import.

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
  const { sanitize = true, to, subject, ...rest } = options;

  // Determine the provider at send time so module import never throws for an
  // unsupported EMAIL_PROVIDER value.
  const providerOrder = getProviderOrder();

  const parsedTo = emailSchema.safeParse(to);
  if (!parsedTo.success) {
    throw new Error(`Invalid recipient email address: ${to}`); // i18n-exempt: developer validation error
  }
  const parsedSubject = subjectSchema.safeParse(subject);
  if (!parsedSubject.success) {
    throw new Error("Email subject is required."); // i18n-exempt: developer validation error
  }

  const opts = {
    ...rest,
    to: parsedTo.data,
    subject: parsedSubject.data,
  } as CampaignOptions;
  if (opts.templateId) {
    const { renderTemplate } = await import("./templates");
    opts.html = renderTemplate(opts.templateId, opts.variables ?? {});
  }
  const optsWithText = await prepareContent(opts, sanitize);
  let lastError: unknown;
  for (let i = 0; i < providerOrder.length; i++) {
    const name = providerOrder[i];
    const isLastProvider = i === providerOrder.length - 1;
    const log = isLastProvider ? console.error : console.warn;
    if (name === "smtp") {
      try {
        await sendWithNodemailer(optsWithText);
        return;
      } catch (err) {
        log("Campaign email send failed", { // i18n-exempt: operational log
          provider: name,
          recipient: optsWithText.to,
          campaignId: optsWithText.campaignId,
          error: err,
        });
        lastError = err;
        continue;
      }
    }
    const current = await loadProvider(name);
    if (!current) continue;
    try {
      await sendWithRetry(current, optsWithText);
      return;
    } catch (err) {
      log("Campaign email send failed", { // i18n-exempt: operational log
        provider: name,
        recipient: optsWithText.to,
        campaignId: optsWithText.campaignId,
        error: err,
      });
      lastError = err;
    }
  }
  if (lastError) throw lastError;
}

async function sendWithRetry(
  provider: CampaignProvider,
  options: CampaignOptions,
  maxRetries = 3
): Promise<void> {
  let attempt = 0;
  while (true) {
    try {
      await provider.send(options);
      return;
    } catch (err) {
      attempt++;
      let retryable: boolean;
      if (err instanceof ProviderError) {
        retryable = err.retryable !== false;
      } else if (hasProviderErrorFields(err)) {
        retryable = err.retryable !== false;
      } else {
        console.warn("Unrecognized provider error", { error: err }); // i18n-exempt: operational log
        retryable = true;
      }
      if (!retryable || attempt >= maxRetries) {
        throw err;
      }
      const delay = 100 * 2 ** (attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function sendWithNodemailer(options: CampaignOptions): Promise<void> {
  const nodemailer = (await import("nodemailer")).default;
  const transport = nodemailer.createTransport({
    url: process.env.SMTP_URL,
  });

  await transport.sendMail({
    from: getDefaultSender(),
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

export {
  sendWithRetry,
  sendWithNodemailer,
};

export { deriveText, ensureText, prepareContent } from "./content";
export { loadProvider, getProviderOrder } from "./providers";
