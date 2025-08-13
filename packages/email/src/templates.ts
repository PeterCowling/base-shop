import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { marketingEmailTemplates } from "@acme/ui";

export interface TemplateParams {
  subject: string;
  body: string;
  logoSrc?: string;
  ctaLabel?: string;
  ctaHref?: string;
  footer?: string;
}

/**
 * Render a marketing email template by id. If the template id is not found,
 * the original body string is returned. A marker comment is prefixed to the
 * returned HTML so that callers can detect if rendering has already been
 * applied.
 */
export function renderTemplate(id: string, params: TemplateParams): string {
  const variant = marketingEmailTemplates.find((t) => t.id === id);
  if (!variant) return params.body;
  const { subject, body, ...rest } = params;
  const html = renderToStaticMarkup(
    variant.render({
      headline: subject,
      content: React.createElement("div", {
        dangerouslySetInnerHTML: { __html: body },
      }),
      ...rest,
    })
  );
  return `<!--template:${id}-->${html}`;
}
