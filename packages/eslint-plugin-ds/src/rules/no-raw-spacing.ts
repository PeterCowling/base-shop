import type { Rule } from "eslint";
import { extractFromJsxAttribute, parseFromExpression } from "../utils/classParser.js";

const ARBITRARY_SPACING_RE = /^(?:-)?(?:(?:m|p)(?:[xytrbl])?|(?:space-[xy]))-\[(.+)\]$/;
const STYLE_SPACING_PROPS = new Set([
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "marginInline",
  "marginInlineStart",
  "marginInlineEnd",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "paddingInline",
  "paddingInlineStart",
  "paddingInlineEnd",
]);

function hintFor(cls: string, value: string): string {
  // Try to suggest a tokenized utility or var-based bracket as a fallback
  const base = cls.replace(/-\[.+\]$/, "");
  // Crude px->token key mapping heuristic for tiny demo scales (1..4)
  const num = parseFloat(value);
  const unit = (value.match(/[a-z%]+$/i)?.[0] || "").toLowerCase();
  let key: string | undefined;
  if (!Number.isNaN(num) && (unit === "px" || unit === "rem")) {
    const px = unit === "rem" ? num * 16 : num;
    const approx = Math.max(1, Math.min(4, Math.round(px / 4)));
    key = String(approx);
    return `${base}-${key}`;
  }
  return `${base}-[var(--space-1)]`;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow raw spacing values: arbitrary Tailwind spacing like m-[13px] and inline style margin/padding values.",
      recommended: false,
    },
    messages: {
      noRawArbitrary: "Avoid raw spacing '{{value}}' in class '{{cls}}'. Use tokens, e.g. '{{hint}}'.",
      noRawStyle: "Avoid raw spacing in style '{{prop}}: {{value}}'. Use design tokens (e.g. var(--space-*)), or a token utility.",
    },
    schema: [],
    hasSuggestions: true,
  },
  create(context) {
    function reportClass(attr: any) {
      const parsed = extractFromJsxAttribute(attr);
      if (!parsed || !parsed.confident) return;
      for (const cls of parsed.classes) {
        const m = cls.match(ARBITRARY_SPACING_RE);
        if (!m) continue;
        const raw = m[1];
        // Ignore already-tokenized values
        if (/var\(/.test(raw)) continue;
        context.report({
          node: attr,
          messageId: "noRawArbitrary",
          data: { value: raw, cls, hint: hintFor(cls, raw) },
        });
      }
    }

    function reportStyle(attr: any) {
      if (!attr || attr.type !== "JSXAttribute" || attr.name?.name !== "style") return;
      const value = attr.value;
      if (!value || value.type !== "JSXExpressionContainer" || !value.expression) return;
      const expr = value.expression;
      // Only static object literals
      if (expr.type !== "ObjectExpression") {
        const parsed = parseFromExpression(expr as any);
        if (!parsed.confident) return;
        return; // nothing to do – not an object literal
      }
      for (const prop of expr.properties) {
        if (prop.type !== "Property") continue;
        const key =
          prop.key.type === "Identifier"
            ? prop.key.name
            : prop.key.type === "Literal" && typeof (prop.key as any).value === "string"
            ? String((prop.key as any).value)
            : undefined;
        if (!key || !STYLE_SPACING_PROPS.has(key)) continue;

        // Check value literal
        let raw: string | undefined;
        if (prop.value.type === "Literal") {
          if (typeof (prop.value as any).value === "string") raw = String((prop.value as any).value);
          if (typeof (prop.value as any).value === "number") raw = String((prop.value as any).value);
        }
        if (!raw) continue;
        // Ignore tokens
        if (/var\(/.test(raw)) continue;
        if (/px|rem|em|%|^\d+$/.test(raw)) {
          context.report({ node: prop.value as any, messageId: "noRawStyle", data: { prop: key, value: raw } });
        }
      }
    }

    return {
      JSXAttribute(node: any) {
        if ((node as any).name?.name === "className" || (node as any).name?.name === "class") {
          reportClass(node);
        } else if ((node as any).name?.name === "style") {
          reportStyle(node);
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
