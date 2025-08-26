import "server-only";
import { createRequire } from "module";
import type { ReactElement, ReactNode } from "react";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

// Use Node's createRequire with the current file path so this works when the
// code is executed in a CommonJS context (e.g. ts-jest).
// eslint-disable-next-line n/no-deprecated-api
const nodeRequire = createRequire(__filename);
function renderToStaticMarkup(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(renderToStaticMarkup).join("");
  }
  if (!React.isValidElement(node)) {
    return "";
  }
  const element = node as ReactElement;
  const type = element.type as string;
  const props = element.props as Record<string, any>;
  const children = props.children;
  const attrs = Object.entries(props)
    .filter(([key]) => key !== "children" && key !== "dangerouslySetInnerHTML")
    .map(([key, value]) => ` ${key}="${String(value)}"`)
    .join("");
  let inner = "";
  if (props.dangerouslySetInnerHTML?.__html) {
    inner = props.dangerouslySetInnerHTML.__html;
  } else if (children) {
    const mapped = React.Children.map(children as any, renderToStaticMarkup);
    inner = mapped ? mapped.join("") : "";
  }
  return `<${type}${attrs}>${inner}</${type}>`;
}

const React = nodeRequire("react") as typeof import("react");

let marketingEmailTemplates: Array<{
  id: string;
  render: (props: any) => ReactElement;
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
  params: Record<string, string>
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
          dangerouslySetInnerHTML: {
            __html: DOMPurify.sanitize(params.body ?? params.content ?? ""),
          },
        }),
        footer: React.createElement(
          "p",
          null,
          params.footer ?? "%%UNSUBSCRIBE%%"
        ),
      })
    );
  }

  throw new Error(`Unknown template: ${id}`);
}
