/* eslint-disable @typescript-eslint/no-explicit-any -- rule inspects generic AST nodes */
import type { Rule } from "eslint";

const MSG_ID = "noHslVarInTests" as const;

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow literal 'hsl(var(--...))' color values in tests. Prefer numeric HSL literals (e.g. '210 10% 50%') or register CSS variables on :root in test setup so contrast checks can resolve tokens.",
    },
    schema: [],
    messages: {
      [MSG_ID]:
        "Avoid 'hsl(var(--…))' in tests: use numeric HSL or set :root tokens (document.documentElement.style.setProperty). Value: '{{value}}'",
    },
  },
  create(context) {
    function reportIfMatch(value: unknown, node: any) {
      if (typeof value !== "string") return;
      if (/hsl\(\s*var\(\s*--[a-z0-9-_]+\s*\)\s*(?:\/[\s\w%.]+)?\)/i.test(value)) {
        context.report({ node, messageId: MSG_ID, data: { value } });
      }
    }

    return {
      Literal(node: any) {
        reportIfMatch(node.value, node);
      },
      TemplateElement(node: any) {
        reportIfMatch(node.value?.raw, node);
      },
      // Also catch JSX attribute string values (e.g., style props in tests)
      JSXAttribute(node: any) {
        const val = node?.value;
        if (!val) return;
        if (val.type === "Literal") reportIfMatch(val.value, val);
        if (val.type === "JSXExpressionContainer" && val.expression?.type === "Literal") {
          reportIfMatch(val.expression.value, val.expression);
        }
      },
    };
  },
};

export default rule;

