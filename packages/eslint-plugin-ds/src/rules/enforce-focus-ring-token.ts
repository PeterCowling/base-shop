import type { Rule } from "eslint";
import { extractFromJsxAttribute } from "../utils/classParser.js";

function lastSeg(token: string): string {
  const i = token.lastIndexOf(":");
  return i >= 0 ? token.slice(i + 1) : token;
}

function hasFocusVisiblePrefix(token: string): boolean {
  return token.split(":").includes("focus-visible");
}

function isRawArbitraryFocus(base: string): boolean {
  return /^ring-\[/.test(base) || /^outline-\[/.test(base);
}

function isOutlineOff(base: string): boolean {
  return base === "outline-none";
}

function isRingOrOutline(base: string): boolean {
  return base === "ring" || base.startsWith("ring-") || base.startsWith("outline-");
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce DS focus-visible tokens: forbid raw ring/outline arbitrary colors and require focus-visible: prefix for focus styles.",
      recommended: false,
    },
    fixable: "code",
    hasSuggestions: true,
    schema: [],
    messages: {
      noRawFocusColor: "Avoid raw focus color '{{base}}'; use DS tokenized focus styles.",
      requireFocusVisible: "Prefix '{{base}}' with 'focus-visible:' to avoid non-accessible focus styles.",
    },
  },
  create(context) {
    return {
      JSXAttribute(node: any) {
        if (!(node.name?.name === "class" || node.name?.name === "className")) return;
        const parsed = extractFromJsxAttribute(node);
        if (!parsed || !parsed.confident) return;
        const classes = parsed.classes;
        const problems: { token: string; base: string; kind: "raw" | "prefix" }[] = [];
        for (const token of classes) {
          const base = lastSeg(token);
          if (isRawArbitraryFocus(base)) problems.push({ token, base, kind: "raw" });
          else if (isRingOrOutline(base) && !isOutlineOff(base) && !hasFocusVisiblePrefix(token)) {
            problems.push({ token, base, kind: "prefix" });
          }
        }
        if (!problems.length) return;

        if (node.value?.type === "Literal" && typeof node.value.value === "string") {
          const orig = String(node.value.value);
          const parts = orig.split(/\s+/).filter(Boolean);
          let changed = false;
          for (let i = 0; i < parts.length; i++) {
            const base = lastSeg(parts[i]);
            if (
              isRingOrOutline(base) &&
              !isOutlineOff(base) &&
              !hasFocusVisiblePrefix(parts[i]) &&
              !isRawArbitraryFocus(base)
            ) {
              parts[i] = `focus-visible:${parts[i]}`;
              changed = true;
            }
          }
          const fixed = parts.join(" ");
          for (const p of problems) {
            if (p.kind === "raw") {
              context.report({ node, messageId: "noRawFocusColor", data: { base: p.base } });
            } else {
              context.report({
                node,
                messageId: "requireFocusVisible",
                data: { base: p.base },
                fix: changed ? (fixer) => fixer.replaceText(node.value as any, `"${fixed}"`) : null as any,
              });
            }
          }
        } else {
          for (const p of problems) {
            context.report({
              node,
              messageId: p.kind === "raw" ? "noRawFocusColor" : "requireFocusVisible",
              data: { base: p.base },
            });
          }
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
