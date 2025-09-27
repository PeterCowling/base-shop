import type { Rule } from "eslint";
import { extractFromJsxAttribute } from "../utils/classParser.js";

function hasUnsafeViewportClass(attr: any): boolean {
  const parsed = extractFromJsxAttribute(attr);
  if (!parsed || !parsed.confident) return false;
  for (const c of parsed.classes) {
    if (c === "h-screen" || c === "min-h-screen" || c === "w-screen" || c === "min-w-screen") return true;
    if (/\[(?:[^\]]*?\b(?:\d+\s*)?(?:vh|vw)\b)[^\]]*\]/.test(c)) return true;
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow unsafe viewport units (vh/vw). Prefer svh/dvh or container queries.",
      recommended: false,
    },
    messages: {
      unsafe: "Avoid vh/vw. Prefer svh/dvh or container queries.",
    },
    schema: [],
  },
  create(context) {
    function reportClass(attr: any) {
      if (hasUnsafeViewportClass(attr)) context.report({ node: attr, messageId: "unsafe" });
    }

    function reportStyle(attr: any) {
      if (!attr || attr.type !== "JSXAttribute" || attr.name?.name !== "style") return;
      const value = attr.value;
      if (!value || value.type !== "JSXExpressionContainer" || !value.expression) return;
      const expr = value.expression;
      if (expr.type !== "ObjectExpression") return;
      for (const prop of expr.properties) {
        if (prop.type !== "Property") continue;
        let raw: string | undefined;
        if (prop.value.type === "Literal") raw = String((prop.value as any).value);
        if (typeof raw === "string" && /\b(\d+\s*)?(vh|vw)\b/.test(raw)) {
          context.report({ node: prop.value as any, messageId: "unsafe" });
        }
      }
    }

    return {
      JSXAttribute(node: any) {
        if ((node as any).name?.name === "className" || (node as any).name?.name === "class") reportClass(node);
        if ((node as any).name?.name === "style") reportStyle(node);
      },
    } as Rule.RuleListener;
  },
};

export default rule;

