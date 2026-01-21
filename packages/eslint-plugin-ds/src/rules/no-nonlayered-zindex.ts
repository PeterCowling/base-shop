import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

const ALLOW_COMPONENTS = new Set(["Modal", "Popover", "Toast", "SkipLink"]);

function getName(node: any): string | undefined {
  const n = node?.name;
  if (!n) return undefined;
  if (n.type === "JSXIdentifier") return n.name;
  return undefined;
}

function hasZClass(attr: any): boolean {
  const parsed = extractFromJsxAttribute(attr);
  if (!parsed || !parsed.confident) return false;
  return parsed.classes.some((c) => c.startsWith("z-"));
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow z-index except in approved layered components.",
      recommended: false,
    },
    messages: {
      noZ: "Only approved layered components (Modal/Popover/Toast/SkipLink) may set z-index.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node: any) {
        const name = getName(node);
        const allowed = !!name && ALLOW_COMPONENTS.has(name);

        let usesZ = false;
        for (const attr of node.attributes || []) {
          if (attr.type !== "JSXAttribute") continue;
          if (attr.name?.name === "className" || attr.name?.name === "class") {
            if (hasZClass(attr)) usesZ = true;
          }
          if (attr.name?.name === "style" && attr.value?.type === "JSXExpressionContainer") {
            const expr = attr.value.expression;
            if (expr?.type === "ObjectExpression") {
              for (const p of expr.properties) {
                if (p.type !== "Property") continue;
                const key = p.key.type === "Identifier" ? p.key.name : p.key.type === "Literal" ? String((p.key as any).value) : undefined;
                if (key === "zIndex") usesZ = true;
              }
            }
          }
        }
        if (usesZ && !allowed) context.report({ node, messageId: "noZ" });
      },
    } as Rule.RuleListener;
  },
};

export default rule;

