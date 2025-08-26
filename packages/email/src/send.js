import nodemailer from "nodemailer";
import sanitizeHtml from "sanitize-html";
import { coreEnv } from "@acme/config/env/core";
import { getDefaultSender } from "./config";
import { SendgridProvider } from "./providers/sendgrid";
import { ResendProvider } from "./providers/resend";
import { ProviderError } from "./providers/types";
import { hasProviderErrorFields } from "./providers/error";
function deriveText(html) {
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
function ensureText(options) {
    if (!options.html) {
        throw new Error("Missing html content for campaign email");
    }
    if (options.text)
        return options;
    return { ...options, text: deriveText(options.html) };
}
const providers = {
    sendgrid: new SendgridProvider(),
    resend: new ResendProvider(),
};
const availableProviders = [...Object.keys(providers), "smtp"];
const providerName = coreEnv.EMAIL_PROVIDER ?? "smtp";
if (!availableProviders.includes(providerName)) {
    throw new Error(`Unsupported EMAIL_PROVIDER "${providerName}". Available providers: ${availableProviders.join(", ")}`);
}
/**
 * Send a campaign email using the configured provider.
 * Falls back to Nodemailer when EMAIL_PROVIDER is unset or unrecognized.
 * If the chosen provider fails, alternate providers are attempted. Each
 * provider is retried with exponential backoff when the error is marked as
 * retryable.
 */
export async function sendCampaignEmail(options) {
    const { sanitize = true, ...rest } = options;
    let opts = { ...rest };
    if (opts.templateId) {
        const { renderTemplate } = await import("./templates");
        opts.html = renderTemplate(opts.templateId, opts.variables ?? {});
    }
    if (sanitize && opts.html) {
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
                '*': ["href", "src", "alt", "title", "width", "height", "style"],
            },
        });
    }
    const optsWithText = ensureText(opts);
    const primary = providerName;
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
        if (!current)
            continue;
        try {
            await sendWithRetry(current, optsWithText);
            return;
        }
        catch (err) {
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
async function sendWithRetry(provider, options, maxRetries = 3) {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            await provider.send(options);
            return;
        }
        catch (err) {
            attempt++;
            const retryable = err instanceof ProviderError
                ? err.retryable
                : hasProviderErrorFields(err)
                    ? err.retryable ?? true
                    : true;
            if (!retryable || attempt >= maxRetries) {
                throw err;
            }
            const delay = 100 * 2 ** (attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
}
async function sendWithNodemailer(options) {
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
