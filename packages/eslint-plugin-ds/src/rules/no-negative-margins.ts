import type { Rule } from "eslint";
import { extractFromJsxAttribute } from "../utils/classParser.js";

type Options = [
  {
    allowed?: string[]; // list of base negative classes to allow (e.g., "-mt-1")
    allowedPaths?: string[]; // list of regex strings; filenames matching are ignored
  }?
];

function getBase(token: string): string {
  const parts = token.split(":");
  return parts[parts.length - 1] || token;
}

function isNegativeMargin(base: string): boolean {
  // -m-2, -mx-4, -mt-px, -m-[...]
  return /^-m(?:[trblxy])?-/.test(base);
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow negative Tailwind margin utilities (e.g., -m-*, -mt-*, -mx-*).",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          allowed: { type: "array", items: { type: "string" } },
          allowedPaths: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noNegative: "Avoid negative margin '{{cls}}'. Use spacing tokens and primitives to compose layouts.",
    },
  },
  create(context) {
    const [{ allowed = [], allowedPaths = [] } = {}] = context.options as Options;
    const allowSet = new Set(allowed);
    const filename = context.getFilename?.() || "";
    const pathAllowed = allowedPaths.some((pat) => {
      try {
        const re = new RegExp(pat);
        return re.test(filename);
      } catch {
        return false;
      }
    });

    return {
      JSXAttribute(node: any) {
        if (!(node.name?.name === "class" || node.name?.name === "className")) return;
        const parsed = extractFromJsxAttribute(node);
        if (!parsed || !parsed.confident) return;
        if (pathAllowed) return;
        for (const cls of parsed.classes) {
          const base = getBase(cls);
          if (!isNegativeMargin(base)) continue;
          if (allowSet.has(base)) continue;
          context.report({ node, messageId: "noNegative", data: { cls } });
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
