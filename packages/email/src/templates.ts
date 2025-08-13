import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { marketingEmailTemplates } from "@acme/ui";

interface RenderParams {
  subject: string;
  body: string;
}

/**
 * Render a marketing email template by id. When no matching template is found,
 * the raw body is returned unchanged.
 */
export function renderTemplate(
  id: string | null | undefined,
  params: RenderParams
): string {
  if (!id) return params.body;
  const variant = marketingEmailTemplates.find((t) => t.id === id);
  if (!variant) return params.body;
  return renderToStaticMarkup(
    variant.render({
      headline: params.subject,
      content: React.createElement("div", {
        dangerouslySetInnerHTML: { __html: params.body },
      }),
    })
  );
}
