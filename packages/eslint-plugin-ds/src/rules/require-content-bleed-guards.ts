import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

const OPTION_LIKE_MARKERS = ["cursor-default", "select-none"];
const BREAK_GUARD_CLASSES = new Set(["break-words", "break-all", "truncate"]);

function getElementName(node: any): string | null {
  const nameNode = node?.name;
  if (!nameNode) return null;

  if (nameNode.type === "JSXIdentifier") {
    return nameNode.name;
  }

  if (nameNode.type === "JSXMemberExpression") {
    return nameNode.property?.name ?? null;
  }

  return null;
}

function hasBreakGuard(classes: Set<string>): boolean {
  for (const cls of BREAK_GUARD_CLASSES) {
    if (classes.has(cls)) return true;
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require content-bleed guards on tabular cells and option-like interactive rows.",
      recommended: false,
    },
    messages: {
      missingBreakGuard:
        "Add a content-bleed guard class (break-words, break-all, or truncate) to this element.",
      missingMinW0:
        "Option-like flex rows must include 'min-w-0' to prevent content overflow in constrained layouts.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node: any) {
        if (!(node.name?.name === "class" || node.name?.name === "className")) return;

        const parsed = extractFromJsxAttribute(node);
        if (!parsed || !parsed.confident) return;

        const classes = new Set(parsed.classes);
        const openingElement = node.parent;
        const elementName = getElementName(openingElement);
        const isTabularCell = elementName === "td" || elementName === "th";
        const isOptionLike = OPTION_LIKE_MARKERS.every((cls) => classes.has(cls));

        if (!isTabularCell && !isOptionLike) return;

        if (!hasBreakGuard(classes)) {
          context.report({ node, messageId: "missingBreakGuard" });
        }

        const isFlexRow = classes.has("flex") || classes.has("inline-flex");
        if (isOptionLike && isFlexRow && !classes.has("min-w-0")) {
          context.report({ node, messageId: "missingMinW0" });
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
