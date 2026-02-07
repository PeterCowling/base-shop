import type { Rule } from "eslint";

const TRANSITION_ALL = /(?:^|\s)transition-all(?:\s|$)/;

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Tailwind transition-all in design-system components; prefer explicit transitions.",
    },
    schema: [],
    messages: {
      noTransitionAll:
        "Avoid transition-all; use explicit transition utilities (transition-colors, transition-opacity, transition-transform, etc.).",
    },
  },
  create(context) {
    const check = (value: string, node: any) => {
      if (!TRANSITION_ALL.test(value)) return;
      context.report({ node: node as any, messageId: "noTransitionAll" });
    };

    return {
      Literal(node: any) {
        if (typeof node.value === "string") check(node.value, node);
      },
      TemplateElement(node: any) {
        check(node.value.raw, node);
      },
    };
  },
};

export default rule;
