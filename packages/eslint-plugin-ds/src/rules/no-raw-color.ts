/* eslint-disable @typescript-eslint/no-explicit-any -- rule uses loose node typing */
import type { Rule } from "eslint";

// Matches hex colors like #RGB, #RGBA, #RRGGBB, or #RRGGBBAA
const HEX_COLOR =
  /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow raw hex colors outside of the design token system",
    },
    schema: [],
    messages: {
      noRawColor: "Use color tokens instead of raw color '{{color}}'.",
    },
  },
  create(context) {
    function report(value: string, node: any) {
      const match = value.match(HEX_COLOR);
      if (match) {
        context.report({
          node: (node as unknown) as any,
          messageId: "noRawColor",
          data: { color: match[0] },
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
