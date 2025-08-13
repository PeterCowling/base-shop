import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { marketingEmailTemplates } from "@acme/ui";

interface RenderParams {
  subject: string;
  body: string;
}

export function renderTemplate(
  id: string | null | undefined,
  params: RenderParams,
): string {
  const { subject, body } = params;
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
