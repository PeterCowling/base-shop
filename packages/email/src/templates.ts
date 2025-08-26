import "server-only";
import type * as React from "react";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { createRequire } from "module";

const nodeRequire =
  typeof require !== "undefined"
    ? require
    : createRequire(eval("import.meta.url"));

const React = nodeRequire("react") as typeof import("react");

let marketingEmailTemplates: Array<{
  id: string;
  render: (props: any) => React.ReactElement;
}> = [];
try {
  marketingEmailTemplates =
    nodeRequire("@acme/ui").marketingEmailTemplates ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} catch {
  // Ignore if @acme/ui is unavailable
}

const { window } = new JSDOM("");
const DOMPurify = createDOMPurify(window);

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

  const { renderToStaticMarkup } = nodeRequire("react-dom/server");
  const variant = marketingEmailTemplates.find((t) => t.id === id);
  if (variant) {
    return renderToStaticMarkup(
      variant.render({
        headline: params.headline ?? params.subject ?? "",
        content: React.createElement("div", {
          dangerouslySetInnerHTML: {
            __html: DOMPurify.sanitize(params.body ?? params.content ?? ""),
          },
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
