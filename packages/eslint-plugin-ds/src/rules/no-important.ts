import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

function hasImportantOutsideArbitrary(token: string): boolean {
  if (!token.includes("!")) return false;
  let depth = 0;
  for (let i = 0; i < token.length; i++) {
    const ch = token[i];
    if (ch === "[") depth++;
    else if (ch === "]") depth = Math.max(0, depth - 1);
    else if (ch === "!" && depth === 0) return true;
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow !important in Tailwind class strings and inline styles.",
      recommended: false,
    },
    messages: {
      noImportantClass: "Avoid important modifier in class '{{cls}}' (contains '!').",
      noImportantStyle: "Avoid !important in inline styles.",
    },
    schema: [],
  },
  create(context) {
    function reportClass(attr: any) {
      const parsed = extractFromJsxAttribute(attr);
      if (!parsed) return;
      for (const cls of parsed.classes) {
        if (hasImportantOutsideArbitrary(cls)) {
          context.report({ node: attr, messageId: "noImportantClass", data: { cls } });
        }
      }
    }

    function reportStyle(attr: any) {
      if (!attr || attr.type !== "JSXAttribute" || attr.name?.name !== "style") return;
      const value = attr.value;
      if (!value) return;
      // style="margin: 0 !important" (rare in React, but guard anyway)
      if (value.type === "Literal" && typeof (value as any).value === "string") {
        if (String((value as any).value).includes("!important")) {
          context.report({ node: value as any, messageId: "noImportantStyle" });
        }
        return;
      }
      if (value.type !== "JSXExpressionContainer" || !value.expression) return;
      const expr = value.expression;
      // Only static object literals
      if (expr.type !== "ObjectExpression") return;
      for (const prop of expr.properties) {
        if (prop.type !== "Property") continue;
        if (prop.value.type === "Literal" && typeof (prop.value as any).value === "string") {
          const s = String((prop.value as any).value);
          if (s.includes("!important")) {
            context.report({ node: prop.value as any, messageId: "noImportantStyle" });
          }
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
