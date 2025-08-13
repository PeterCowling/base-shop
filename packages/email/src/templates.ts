import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { marketingEmailTemplates } from "@acme/ui";

interface RenderTemplateParams {
  subject: string;
  body: string;
}

/**
 * Render a marketing email template with the given content.
 * Falls back to returning the body with an unsubscribe placeholder when
 * the template id is missing or unrecognized.
 */
export function renderTemplate(
  id: string | null | undefined,
  { subject, body }: RenderTemplateParams,
): string {
  if (id) {
    const variant = marketingEmailTemplates.find((t) => t.id === id);
    if (variant) {
      return renderToStaticMarkup(
        variant.render({
          headline: subject,
          content: React.createElement("div", {
            dangerouslySetInnerHTML: { __html: body },
          }),
          footer: React.createElement("p", null, "%%UNSUBSCRIBE%%"),
        }),
      );
    }
  }
  return `${body}<p>%%UNSUBSCRIBE%%</p>`;
}

export type { RenderTemplateParams };
