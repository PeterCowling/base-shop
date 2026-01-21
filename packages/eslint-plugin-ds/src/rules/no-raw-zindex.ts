import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

const Z_RE = /^z-\[(.+)\]$/;

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow arbitrary z-index via z-[..]; use approved layered components or DS tokens.",
      recommended: false,
    },
    messages: {
      noRawZ: "Avoid arbitrary z-index '{{raw}}' in class '{{cls}}'.",
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
          const m = cls.match(Z_RE);
          if (!m) continue;
          const raw = m[1];
          if (/var\(/.test(raw)) continue;
          context.report({ node, messageId: "noRawZ", data: { raw, cls } });
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
