import type { Rule } from "eslint";
import { extractFromJsxAttribute } from "../utils/classParser.js";

type Options = [
  {
    allowedFunctions?: string[];
  }?
];


function getBracketContent(token: string): string | null {
  const idx = token.indexOf("-[");
  if (idx === -1) return null;
  const start = idx + 2; // after '-['
  const end = token.lastIndexOf("]");
  if (end === -1 || end <= start) return null;
  return token.slice(start, end);
}

function hasAllowedFunction(content: string, allowed: Set<string>): boolean {
  // Match a CSS function name at start (or after optional quotes)
  // e.g. url(…), hsl(…), var(…)
  const m = content.match(/([a-zA-Z_][\w-]*)\s*\(/);
  if (!m) return false;
  const fn = m[1].toLowerCase();
  return allowed.has(fn);
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow arbitrary Tailwind values (…-[…]) across class lists.",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedFunctions: {
            type: "array",
            items: { type: "string" },
            default: [],
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noArbitrary:
        "Avoid arbitrary Tailwind value '{{value}}' in class '{{cls}}'. Prefer design tokens or approved utilities.",
    },
  },
  create(context) {
    const [{ allowedFunctions = [] } = {}] = context.options as Options;
    const allowed = new Set(allowedFunctions.map((s) => s.toLowerCase())) as Set<string>;

    return {
      JSXAttribute(node: any) {
        if (!(node.name?.name === "class" || node.name?.name === "className")) return;
        const parsed = extractFromJsxAttribute(node);
        if (!parsed || !parsed.confident) return;
        for (const cls of parsed.classes) {
          if (!cls.includes("-[")) continue;
          const content = getBracketContent(cls);
          if (!content) continue;
          // Allowlist certain CSS functions if configured
          if (hasAllowedFunction(content, allowed)) continue;
          context.report({ node, messageId: "noArbitrary", data: { value: content, cls } });
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
