import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

const SHADOW_RE = /^shadow-\[(.+)\]$/;

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow arbitrary box-shadow via shadow-[..]; use DS shadow tokens.",
      recommended: false,
    },
    messages: {
      noRawShadow: "Avoid arbitrary shadow '{{raw}}' in class '{{cls}}'. Use DS tokens (shadow-sm/md/lg or elevation-*).",
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
          const m = cls.match(SHADOW_RE);
          if (!m) continue;
          const raw = m[1];
          if (/var\(/.test(raw)) continue; // allow tokenized var()
          context.report({ node, messageId: "noRawShadow", data: { raw, cls } });
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
