import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

export interface MarketingEmailTemplateVariant {
  id: string;
  render: (props: {
    headline: string;
    content: React.ReactNode;
    footer: React.ReactNode;
  }) => React.ReactElement;
}

let marketingEmailTemplates: MarketingEmailTemplateVariant[] = [];

export function setMarketingEmailTemplates(
  templates: MarketingEmailTemplateVariant[],
): void {
  marketingEmailTemplates = templates;
}

const templates: Record<string, string> = {};

/**
 * Register or replace a template by ID.
 */
export function registerTemplate(id: string, template: string): void {
  templates[id] = template;
}

/**
 * Clear all registered templates. Primarily for testing.
 */
export function clearTemplates(): void {
  for (const key of Object.keys(templates)) {
    delete templates[key];
  }
}

/**
 * Render a template with the provided variables. Placeholders in the template
 * use the Handlebars-like syntax `{{variable}}`.
 */
export function renderTemplate(
  id: string,
  params: Record<string, string>,
): string {
  const source = templates[id];
  if (source) {
    return source.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
      return params[key] ?? "";
    });
  }

  const variant = marketingEmailTemplates.find((t) => t.id === id);
  if (variant) {
    return renderToStaticMarkup(
      variant.render({
        headline: params.headline ?? params.subject ?? "",
        content: React.createElement("div", {
          dangerouslySetInnerHTML: { __html: params.body ?? params.content ?? "" },
        }),
        footer: React.createElement(
          "p",
          null,
          params.footer ?? "%%UNSUBSCRIBE%%",
        ),
      }),
    );
  }

  throw new Error(`Unknown template: ${id}`);
}
