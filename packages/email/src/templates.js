import "server-only";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { createRequire } from "module";

const nodeRequire =
  typeof require !== "undefined"
    ? require
    : createRequire(eval("import.meta.url"));
const React = nodeRequire("react");
let marketingEmailTemplates = [];
try {
  marketingEmailTemplates =
    (nodeRequire("@acme/ui").marketingEmailTemplates ?? []);
}
catch {
  // Ignore if @acme/ui is unavailable
}
const { window } = new JSDOM("");
const DOMPurify = createDOMPurify(window);
const templates = {};
/**
 * Register or replace a template by ID.
 */
export function registerTemplate(id, template) {
    templates[id] = template;
}
/**
 * Clear all registered templates. Primarily for testing.
 */
export function clearTemplates() {
    for (const key of Object.keys(templates)) {
        delete templates[key];
    }
}
/**
 * Render a template with the provided variables. Placeholders in the template
 * use the Handlebars-like syntax `{{variable}}`.
 */
export function renderTemplate(id, params) {
    const source = templates[id];
    if (source) {
        return source.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
            return params[key] ?? "";
        });
    }
    const { renderToStaticMarkup } = nodeRequire("react-dom/server");
    const variant = marketingEmailTemplates.find((t) => t.id === id);
    if (variant) {
        return renderToStaticMarkup(variant.render({
            headline: params.headline ?? params.subject ?? "",
            content: React.createElement("div", {
                dangerouslySetInnerHTML: {
                    __html: DOMPurify.sanitize(params.body ?? params.content ?? ""),
                },
            }),
            footer: React.createElement("p", null, params.footer ?? "%%UNSUBSCRIBE%%"),
        }));
    }
    throw new Error(`Unknown template: ${id}`);
}
