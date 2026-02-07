import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

function lastSeg(token: string): string {
  const i = token.lastIndexOf(":");
  return i >= 0 ? token.slice(i + 1) : token;
}

function isLayoutToken(base: string): boolean {
  return (
    base === "flex" ||
    base === "grid" ||
    base === "block" ||
    base === "inline" ||
    base.startsWith("w-") ||
    base.startsWith("h-") ||
    base.startsWith("min-w-") ||
    base.startsWith("min-h-") ||
    base.startsWith("p") || // p-, px-, py-, pt-...
    base.startsWith("m") || // m-, mx-, my-, mt-...
    base.startsWith("gap-") ||
    base.startsWith("col-") ||
    base.startsWith("row-")
  );
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Forbid sr-only on elements that also carry visible/layout classes.",
      recommended: false,
    },
    schema: [],
    messages: {
      misused: "Do not combine 'sr-only' with visible/layout classes ({{offender}}). Use aria-* on a visible control or move sr-only content to a separate element.",
    },
  },
  create(context) {
    return {
      JSXAttribute(node: any) {
        if (!(node.name?.name === "class" || node.name?.name === "className")) return;
        const parsed = extractFromJsxAttribute(node);
        if (!parsed || !parsed.confident) return;
        const classes = parsed.classes;
        const hasSrOnly = classes.some((t) => lastSeg(t) === "sr-only");
        if (!hasSrOnly) return;
        for (const t of classes) {
          const base = lastSeg(t);
          if (base !== "sr-only" && isLayoutToken(base)) {
            context.report({ node, messageId: "misused", data: { offender: base } });
            break;
          }
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;

