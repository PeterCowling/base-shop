import type { CampaignOptions } from "./send";

export function deriveText(html: string): string {
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

export function ensureText(options: CampaignOptions): CampaignOptions {
  if (!options.html) {
    throw new Error("Missing html content for campaign email");
  }
  if (options.text) return options;
  return { ...options, text: deriveText(options.html) };
}

export async function prepareContent(
  options: CampaignOptions,
  sanitize = true
): Promise<CampaignOptions> {
  const opts = { ...options };
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
  return ensureText(opts);
}

