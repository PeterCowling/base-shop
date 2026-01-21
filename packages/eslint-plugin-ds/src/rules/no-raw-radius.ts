import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

const RADIUS_RE = /^rounded(?:-[a-z-]+)?-\[(.+)\]$/;

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow arbitrary border-radius via rounded-[..] classes; use DS radius tokens.",
      recommended: false,
    },
    messages: {
      noRawRadius: "Avoid arbitrary radius '{{raw}}' in class '{{cls}}'. Use DS tokens (rounded-sm/md/lg).",
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
          const m = cls.match(RADIUS_RE);
          if (!m) continue;
          const raw = m[1];
          if (/var\(/.test(raw)) continue; // allow tokenized var()
          context.report({ node, messageId: "noRawRadius", data: { raw, cls } });
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
