import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

const RISK_CLASSES = new Set(["truncate", "overflow-hidden", "text-ellipsis", "whitespace-nowrap"]);

function has(base: string, set: Set<string>) {
  return set.has(base);
}

function lastSegment(token: string): string {
  const i = token.lastIndexOf(":");
  return i >= 0 ? token.slice(i + 1) : token;
}

function needsMinW(classes: string[]): boolean {
  let hasFlexRow = false;
  let hasGrow = false;
  let risk = false;
  for (const cls of classes) {
    const base = lastSegment(cls);
    if (base === "flex" || base === "inline-flex") continue; // not decisive alone
    if (base === "flex-row") hasFlexRow = true;
    if (base === "flex-1" || base === "grow") hasGrow = true;
    if (has(base, RISK_CLASSES)) risk = true;
  }
  return hasFlexRow && hasGrow && risk;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "When an element uses flex-row and flex-1/grow with text/overflow risk, require min-w-0 to prevent overflow.",
      recommended: false,
    },
    fixable: "code",
    hasSuggestions: true,
    schema: [],
    messages: {
      requireMinW: "Add 'min-w-0' to prevent text overflow in flex rows.",
    },
  },
  create(context) {
    return {
      JSXAttribute(node: any) {
        if (!(node.name?.name === "class" || node.name?.name === "className")) return;
        const parsed = extractFromJsxAttribute(node);
        if (!parsed || !parsed.confident) return;
        const classes = parsed.classes;
        const hasMinW = classes.some((c) => lastSegment(c) === "min-w-0");
        if (hasMinW) return;
        if (!needsMinW(classes)) return;

        if (node.value?.type === "Literal" && typeof node.value.value === "string") {
          const orig = String(node.value.value);
          const fixed = orig.trim().length ? `${orig} min-w-0` : "min-w-0";
          context.report({
            node,
            messageId: "requireMinW",
            fix(fixer) {
              return fixer.replaceText(node.value as any, `"${fixed}"`);
            },
          });
        } else {
          context.report({ node, messageId: "requireMinW" });
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;

