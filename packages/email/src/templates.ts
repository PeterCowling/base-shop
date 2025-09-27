import "server-only";
import { createRequire } from "module";
import type { ReactElement, ReactNode } from "react";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import {
  marketingEmailTemplates,
  type MarketingEmailTemplateVariant,
} from "@acme/email-templates";
import { escapeHtml } from "./escapeHtml";

// Use Node's createRequire with the current file path so this works when the
// code is executed in a CommonJS context (e.g. ts-jest).
const nodeRequire = createRequire(__filename);
export function renderToStaticMarkup(node: ReactNode): string {
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
  const props = element.props as Record<string, unknown>;
  const children = props.children as ReactNode | undefined;
  const attrs = Object.entries(props)
    .filter(([key]) => key !== "children" && key !== "dangerouslySetInnerHTML")
    .map(([key, value]) => ` ${key}="${String(value)}"`)
    .join("");
  let inner = "";
  const dsi = props.dangerouslySetInnerHTML as
    | { __html?: string }
    | undefined;
  if (dsi?.__html) {
    inner = dsi.__html;
  } else if (children) {
    const mapped = React.Children.map(children as ReactNode, renderToStaticMarkup);
    inner = mapped ? mapped.join("") : "";
  }
  return `<${type}${attrs}>${inner}</${type}>`;
}

let React: typeof import("react");
try {
  React = nodeRequire("react") as typeof import("react");
} catch {
  // Provide a minimal React fallback for environments where React isn't
  // installed (e.g. during tests). This implements only the features used by
  // this module: `createElement`, `isValidElement`, and `Children.map`.
  type ReactFallbackElement = { type: unknown; props: Record<string, unknown> };

  React = {
    createElement(type: unknown, props: Record<string, unknown> | null, ...children: ReactNode[]): ReactFallbackElement {
      return {
        type,
        props: { ...(props ?? {}), children: children.length > 1 ? children : children[0] },
      } as ReactFallbackElement;
    },
    isValidElement(element: unknown): element is ReactFallbackElement {
      if (typeof element !== "object" || element === null) return false;
      const obj = element as Record<string, unknown>;
      return "type" in obj && "props" in obj;
    },
    Children: {
      map(children: ReactNode, fn: (child: ReactNode) => string): string[] {
        if (children === undefined || children === null || typeof children === "boolean") return [];
        return Array.isArray(children) ? (children as ReactNode[]).map(fn) : [fn(children)];
      },
    },
  } as unknown as typeof import("react");
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
    return source.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) =>
      escapeHtml(params[key] ?? "")
    );
  }
  const variant = (marketingEmailTemplates as MarketingEmailTemplateVariant[]).find(
    (t) => t.id === id
  );
  if (variant) {
    return renderToStaticMarkup(
      variant.make({
        headline: params.headline ?? params.subject ?? "",
        content: React.createElement("div", {
          dangerouslySetInnerHTML: {
            __html: DOMPurify.sanitize(params.body ?? params.content ?? "", {
              FORBID_ATTR: ["style"],
            }),
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

  throw new Error(`Unknown template: ${id}`); // i18n-exempt: developer error for missing template
}

// Export the React reference for testing purposes.
export { React as __reactShim };
