import "server-only";
import type { CampaignProvider } from "./providers/types";
import { ProviderError } from "./providers/types";
import { hasProviderErrorFields } from "./providers/error";
import { getDefaultSender } from "./config";

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

const providerCache: Record<string, CampaignProvider | undefined> = {};

async function loadProvider(
  name: string
): Promise<CampaignProvider | undefined> {
  if (Object.prototype.hasOwnProperty.call(providerCache, name)) {
    return providerCache[name];
  }

  if (name === "sendgrid") {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      providerCache[name] = undefined;
      return undefined;
    }
    const { SendgridProvider } = await import("./providers/sendgrid");
    providerCache[name] = new SendgridProvider();
  } else if (name === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      providerCache[name] = undefined;
      return undefined;
    }
    const { ResendProvider } = await import("./providers/resend");
    providerCache[name] = new ResendProvider();
  } else {
    providerCache[name] = undefined;
  }

  return providerCache[name];
}

const availableProviders = ["sendgrid", "resend", "smtp"];

const configuredProvider = process.env.EMAIL_PROVIDER || undefined;

if (configuredProvider && !availableProviders.includes(configuredProvider)) {
  throw new Error(
    `Unsupported EMAIL_PROVIDER "${configuredProvider}". Available providers: ${availableProviders.join(", ")}`
  );
}

// Read provider preference directly from `process.env` so tests or runtime code
// that mutate environment variables after the configuration module has loaded
// can still influence the chosen provider.

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
  const { sanitize = true, ...rest } = options;
  const opts = { ...rest } as CampaignOptions;
  if (opts.templateId) {
    const { renderTemplate } = await import("./templates");
    opts.html = renderTemplate(opts.templateId, opts.variables ?? {});
  }
  if (sanitize && opts.html) {
    const sanitizeHtml = (await import("sanitize-html")).default;
    opts.html = sanitizeHtml(opts.html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([
        "img",
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "br",
        "span",
        "div",
        "ul",
        "ol",
        "li",
        "table",
        "thead",
        "tbody",
        "tr",
        "td",
        "th",
      ]),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        "*": ["href", "src", "alt", "title", "width", "height", "style"],
      },
    });
  }
  const optsWithText = ensureText(opts);
  const primary = process.env.EMAIL_PROVIDER || "smtp";
  if (!availableProviders.includes(primary)) {
    throw new Error(
      `Unsupported EMAIL_PROVIDER "${primary}". Available providers: ${availableProviders.join(", ")}`
    );
  }
  const providerOrder = [
    primary,
    ...availableProviders.filter((p) => p !== primary),
  ];
  let lastError: unknown;
  for (const name of providerOrder) {
    if (name === "smtp") {
      try {
        await sendWithNodemailer(optsWithText);
        return;
      } catch (err) {
        console.error("Campaign email send failed", {
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
      console.error("Campaign email send failed", {
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
        retryable = err.retryable;
      } else if (hasProviderErrorFields(err)) {
        retryable = err.retryable ?? false;
      } else {
        console.warn("Unrecognized provider error", { error: err });
        retryable = false;
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
  deriveText,
  ensureText,
  loadProvider,
  sendWithRetry,
  sendWithNodemailer,
};
