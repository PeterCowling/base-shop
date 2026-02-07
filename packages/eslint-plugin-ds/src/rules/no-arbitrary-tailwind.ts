import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

type Options = [
  {
    allowedFunctions?: string[];
    // Allow content inside brackets by regex, e.g. /^-?\d+(?:\.\d+)?%$/
    allowedContentPatterns?: string[];
    // Allowlist utilities (prefix before -[) to pair with allowedContentPatterns, e.g. ["translate-x","translate-y"]
    allowedUtilities?: string[];
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

function startsWithUtility(token: string, util: string): boolean {
  // Accept utility or its negative variant (e.g., "translate-x" or "-translate-x")
  return token.startsWith(`${util}-[`) || token.startsWith(`-${util}-[`);
}

function isAllowedByUtilityPattern(
  token: string,
  content: string,
  utilities: Set<string>,
  contentRegexes: RegExp[]
): boolean {
  if (utilities.size === 0 || contentRegexes.length === 0) return false;
  // Only consider when token matches an allowed utility prefix
  let matchesUtility = false;
  for (const u of utilities) {
    if (startsWithUtility(token, u)) {
      matchesUtility = true;
      break;
    }
  }
  if (!matchesUtility) return false;
  return contentRegexes.some((re) => re.test(content));
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
          allowedContentPatterns: {
            type: "array",
            items: { type: "string" },
            default: [],
          },
          allowedUtilities: {
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
    const [opts = {}] = context.options as Options;
    const { allowedFunctions = [], allowedContentPatterns = [], allowedUtilities = [] } = opts;
    const allowed = new Set(allowedFunctions.map((s) => s.toLowerCase())) as Set<string>;
    const contentRegexes = allowedContentPatterns
      .map((p) => {
        try {
          // Intentional: compile user-provided allowlist patterns (from lint config)
          return new RegExp(p);
        } catch {
          return null;
        }
      })
      .filter((x): x is RegExp => Boolean(x));
    const utilities = new Set(allowedUtilities);

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
          // Allow patterns (e.g., percentages) for certain utilities (e.g., translate-x/y)
          if (isAllowedByUtilityPattern(cls, content, utilities, contentRegexes)) continue;
          context.report({ node, messageId: "noArbitrary", data: { value: content, cls } });
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
