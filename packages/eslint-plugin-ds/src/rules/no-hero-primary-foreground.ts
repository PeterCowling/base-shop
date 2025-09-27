 
import type { Rule } from "eslint";

const MSG_ID = "noHeroPrimaryForeground" as const;

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow pairing 'bg-hero' with 'text-primary-foreground'. Use 'bg-hero-contrast' + 'text-hero-foreground' to guarantee WCAG contrast.",
    },
    schema: [],
    messages: {
      [MSG_ID]:
        "Avoid 'bg-hero' with 'text-primary-foreground'. Use 'bg-hero-contrast' + 'text-hero-foreground' for accessible hero sections.",
    },
  },
  create(context) {
    function checkValue(val: unknown, node: any) {
      if (typeof val !== "string") return;
      const hasBgHero = /\bbg-hero\b/.test(val) && !/\bbg-hero-contrast\b/.test(val);
      const hasPrimaryFg = /\btext-primary-foreground\b/.test(val);
      if (hasBgHero && hasPrimaryFg) {
        context.report({ node, messageId: MSG_ID });
      }
    }

    return {
      JSXAttribute(node: any) {
        if (node.name?.name !== "className") return;
        const val = node.value;
        if (!val) return;
        if (val.type === "Literal") checkValue(val.value, val);
        if (val.type === "JSXExpressionContainer") {
          const expr = val.expression;
          if (expr?.type === "Literal") checkValue(expr.value, expr);
          if (expr?.type === "TemplateLiteral") {
            // Check static portions of template literal
            for (const q of expr.quasis) checkValue(q.value?.raw, q);
          }
        }
      },
    };
  },
};

export default rule;

