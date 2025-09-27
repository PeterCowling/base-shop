 
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
    function containsHslVar(value: string): boolean {
      // Lightweight, safe scan without complex regex backtracking
      const lower = value.toLowerCase();
      const iHsl = lower.indexOf("hsl(");
      if (iHsl === -1) return false;
      const iVar = lower.indexOf("var(", iHsl + 4);
      if (iVar === -1) return false;
      const iToken = lower.indexOf("--", iVar + 4);
      if (iToken === -1) return false;
      const closeVar = lower.indexOf(")", iVar + 4);
      if (closeVar === -1) return false;
      const closeHsl = lower.indexOf(")", closeVar + 1);
      if (closeHsl === -1) return false;
      return true;
    }

    function reportIfMatch(value: unknown, node: any) {
      if (typeof value !== "string") return;
      if (containsHslVar(value)) {
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
