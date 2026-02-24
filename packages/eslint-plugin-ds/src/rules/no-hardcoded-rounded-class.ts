import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

const ALLOWED_BASE_CLASSES = new Set([
  "rounded-[inherit]",
]);

const TOKEN_RADIUS_RE = /^rounded-\[var\(--[a-z0-9-_]+\)\]$/i;

function getBaseClassToken(cls: string): string {
  const withoutImportant = cls.startsWith("!") ? cls.slice(1) : cls;
  const parts = withoutImportant.split(":");
  return parts[parts.length - 1] ?? withoutImportant;
}

function isRoundedClass(baseClass: string): boolean {
  return /^rounded(?:-[a-z0-9-]+|\[[^\]]+\])?$/i.test(baseClass);
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow hardcoded rounded-* utilities in JSX; use shape/radius props and resolveShapeRadiusClass().",
      recommended: false,
    },
    messages: {
      noHardcodedRounded:
        "Avoid hardcoded radius class '{{cls}}'. Use shape/radius props and resolveShapeRadiusClass().",
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
          if (cls.startsWith("file:rounded-")) continue;

          const baseClass = getBaseClassToken(cls);
          if (!isRoundedClass(baseClass)) continue;
          if (ALLOWED_BASE_CLASSES.has(baseClass)) continue;
          if (TOKEN_RADIUS_RE.test(baseClass)) continue;

          context.report({
            node,
            messageId: "noHardcodedRounded",
            data: { cls },
          });
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
