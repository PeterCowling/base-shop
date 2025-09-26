import type { Rule } from "eslint";
import { extractFromJsxAttribute } from "../utils/classParser.js";
import { getLayer } from "../utils/layer.js";

type Options = [
  {
    allowed?: string[]; // allowed class tokens (base, e.g., "mt-1", "mx-auto")
    allowedProps?: string[]; // allowed style props (e.g., "marginInlineStart")
    allowedPaths?: string[]; // regex strings; filenames matching are ignored
  }?
];

const MARGIN_BASE_RE = /^-?m(?:[trblxy])?-(.+)$/; // matches m-*, mt-*, mx-*, and negative variants
const STYLE_PROPS = new Set([
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "marginInline",
  "marginInlineStart",
  "marginInlineEnd",
  "marginBlock",
  "marginBlockStart",
  "marginBlockEnd",
]);

function lastSegment(token: string): string {
  const i = token.lastIndexOf(":");
  return i >= 0 ? token.slice(i + 1) : token;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow margins on atom-layer components (class or inline style).",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          allowed: { type: "array", items: { type: "string" } },
          allowedProps: { type: "array", items: { type: "string" } },
          allowedPaths: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noMarginClass: "Atoms must not declare margin class '{{cls}}' (use layout primitives instead).",
      noMarginStyle: "Atoms must not declare inline style margin '{{prop}}' (use layout primitives instead).",
    },
  },
  create(context) {
    const [{ allowed = [], allowedProps = [], allowedPaths = [] } = {}] = context.options as Options;
    const allowSet = new Set(allowed);
    const allowPropsSet = new Set(allowedProps);
    const filename = context.getFilename?.() || "";
    const pathAllowed = allowedPaths.some((pat) => {
      try {
        const re = new RegExp(pat);
        return re.test(filename);
      } catch {
        return false;
      }
    });

    const layer = getLayer(context, filename);
    if (layer !== "atom" || pathAllowed) {
      return {} as Rule.RuleListener;
    }

    return {
      JSXAttribute(node: any) {
        const name = node.name?.name;
        if (name === "class" || name === "className") {
          const parsed = extractFromJsxAttribute(node);
          if (!parsed || !parsed.confident) return;
          for (const cls of parsed.classes) {
            const base = lastSegment(cls);
            if (MARGIN_BASE_RE.test(base) && !allowSet.has(base)) {
              context.report({ node, messageId: "noMarginClass", data: { cls } });
            }
          }
        } else if (name === "style") {
          const value = node.value;
          if (!value || value.type !== "JSXExpressionContainer" || !value.expression) return;
          const expr = value.expression;
          if (expr.type !== "ObjectExpression") return;
          for (const prop of expr.properties) {
            if (prop.type !== "Property") continue;
            const keyName =
              prop.key.type === "Identifier"
                ? prop.key.name
                : prop.key.type === "Literal" && typeof (prop.key as any).value === "string"
                ? String((prop.key as any).value)
                : undefined;
            if (!keyName) continue;
            if (STYLE_PROPS.has(keyName) && !allowPropsSet.has(keyName)) {
              context.report({ node: prop.value as any, messageId: "noMarginStyle", data: { prop: keyName } });
            }
          }
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
