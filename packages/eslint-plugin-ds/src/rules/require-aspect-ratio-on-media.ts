import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

const MEDIA_TAGS = new Set(["img", "video", "iframe", "picture"]);
const DS_ASPECT_ATTRS = new Set(["aspect", "data-aspect", "mediaAspect", "ratio"]);

function getJsxName(node: any): string | undefined {
  const n = node?.name;
  if (!n) return undefined;
  if (n.type === "JSXIdentifier") return n.name;
  return undefined;
}

function hasAspectUtility(attr: any): boolean {
  const parsed = extractFromJsxAttribute(attr);
  if (!parsed || !parsed.confident) return false;
  return parsed.classes.some((c) => c.startsWith("aspect-"));
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Media elements must declare an aspect ratio via Tailwind's aspect-* utilities or a DS aspect prop.",
      recommended: false,
    },
    messages: {
      missingAspect:
        "Media element <{{tag}}> should include an aspect-* class or DS aspect prop (e.g., data-aspect).",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node: any) {
        const tag = getJsxName(node);
        if (!tag || !MEDIA_TAGS.has(tag)) return;

        // Look for className/class with static aspect-*
        let hasAspect = false;
        for (const attr of node.attributes || []) {
          if (attr.type !== "JSXAttribute") continue;
          const name = attr.name?.name;
          if (name === "className" || name === "class") {
            if (hasAspectUtility(attr)) {
              hasAspect = true;
              break;
            }
          }
        }
        if (hasAspect) return;

        // Allow DS aspect prop escape hatch
        const hasDsAspect = (node.attributes || []).some(
          (attr: any) => attr.type === "JSXAttribute" && DS_ASPECT_ATTRS.has(attr.name?.name)
        );
        if (hasDsAspect) return;

        // If className exists but not statically determinable, do not report per shared policy
        const classAttr = (node.attributes || []).find(
          (a: any) => a.type === "JSXAttribute" && (a.name?.name === "className" || a.name?.name === "class")
        );
        if (classAttr) {
          const parsed = extractFromJsxAttribute(classAttr);
          if (!parsed || !parsed.confident) return;
        }

        context.report({ node, messageId: "missingAspect", data: { tag } });
      },
    } as Rule.RuleListener;
  },
};

export default rule;

