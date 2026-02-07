import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

function hasClass(attr: any, pred: (c: string) => boolean): boolean {
  const parsed = extractFromJsxAttribute(attr);
  if (!parsed || !parsed.confident) return false;
  return parsed.classes.some(pred);
}

function isPositionedClass(c: string): boolean {
  return c === "relative" || c === "sticky" || c.startsWith("relative-");
}

function isAbsolutelyPositionedClass(c: string): boolean {
  return c === "absolute" || c === "fixed" || c === "sticky"; // sticky also needs container constraints
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Require a positioned ancestor for absolute/fixed children (heuristic in-file).",
      recommended: false,
    },
    messages: {
      needsParent: "Absolute/fixed element should have a positioned ancestor (e.g., relative).",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node: any) {
        let isAbs = false;
        for (const attr of node.attributes || []) {
          if (attr.type !== "JSXAttribute") continue;
          if (attr.name?.name === "className" || attr.name?.name === "class") {
            if (hasClass(attr, isAbsolutelyPositionedClass)) {
              isAbs = true;
              break;
            }
          }
        }
        if (!isAbs) return;

        const ancestors = context.getSourceCode().getAncestors(node as any);
        for (let i = ancestors.length - 1; i >= 0; i--) {
          const a: any = ancestors[i];
          if (a?.type === "JSXElement") {
            const open = a.openingElement;
            for (const attr of open.attributes || []) {
              if (attr.type !== "JSXAttribute") continue;
              if (attr.name?.name === "className" || attr.name?.name === "class") {
                if (hasClass(attr, isPositionedClass)) return; // ok
              }
            }
          }
        }
        context.report({ node, messageId: "needsParent" });
      },
    } as Rule.RuleListener;
  },
};

export default rule;
