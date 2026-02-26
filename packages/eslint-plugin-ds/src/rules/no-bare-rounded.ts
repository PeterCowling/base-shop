import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

function getBaseClassToken(cls: string): string {
  const withoutImportant = cls.startsWith("!") ? cls.slice(1) : cls;
  const parts = withoutImportant.split(":");
  return parts[parts.length - 1] ?? withoutImportant;
}

function isBareRounded(baseClass: string): boolean {
  return baseClass === "rounded";
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    fixable: "code",
    docs: {
      description:
        "Disallow bare 'rounded' class in JSX; use 'rounded-lg' to match the reception app visual standard.",
      recommended: false,
    },
    messages: {
      noBareRounded:
        "Bare class '{{cls}}' should be 'rounded-lg'. The reception app visual standard requires rounded-lg for all controls.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node: any) {
        if (!(node.name?.name === "class" || node.name?.name === "className")) return;

        const parsed = extractFromJsxAttribute(node);
        if (!parsed || !parsed.confident) return;

        for (const cls of parsed.classes) {
          if (cls.startsWith("file:")) continue;
          const baseClass = getBaseClassToken(cls);
          if (!isBareRounded(baseClass)) continue;

          context.report({
            node,
            messageId: "noBareRounded",
            data: { cls },
            fix(fixer) {
              if (!node.value) return null;
              const raw = context.getSourceCode().getText(node.value);
              const fixed = raw.replace(/\brounded(?!-)/g, "rounded-lg");
              if (fixed === raw) return null;
              return fixer.replaceText(node.value, fixed);
            },
          });
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
