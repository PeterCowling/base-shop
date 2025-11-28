 
import type { Rule } from "eslint";

const DISALLOWED_FONTS = [
  "arial",
  "helvetica",
  "times",
  "courier",
  "sans-serif",
  "serif",
  "monospace",
];

function containsDisallowed(value: string): string | undefined {
  if (value.includes("var(")) return undefined;
  const lower = value.toLowerCase();
  if (lower.includes("aria-label") || lower.includes("arialabel")) return undefined;
  return DISALLOWED_FONTS.find((f) => lower.includes(f));
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow raw font stacks outside of the design token system",
    },
    schema: [],
    messages: {
      noRawFont: "Use typography tokens instead of raw font stack '{{font}}'.",
    },
  },
  create(context) {
    function report(value: string, node: any) {
      const font = containsDisallowed(value);
      if (font) {
        context.report({
          node: (node as unknown) as any,
          messageId: "noRawFont",
          data: { font },
        });
      }
    }

    return {
      Literal(node: any) {
        if (typeof node.value === "string") {
          report(node.value, node);
        }
      },
      TemplateElement(node: any) {
        report(node.value.raw, node);
      },
    };
  },
};

export default rule;
