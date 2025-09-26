import type { Rule } from "eslint";
import { extractFromJsxAttribute } from "../utils/classParser.js";

function lastSeg(token: string): string {
  const i = token.lastIndexOf(":");
  return i >= 0 ? token.slice(i + 1) : token;
}

function withPrefix(token: string, nextBase: string): string {
  const i = token.lastIndexOf(":");
  return i >= 0 ? token.slice(0, i + 1) + nextBase : nextBase;
}

function mapLogical(base: string): { to?: string; fixable: boolean } | null {
  if (base.startsWith("ml-")) return { to: base.replace(/^ml-/, "ms-"), fixable: true };
  if (base.startsWith("mr-")) return { to: base.replace(/^mr-/, "me-"), fixable: true };
  if (base === "text-left") return { to: "text-start", fixable: true };
  if (base === "text-right") return { to: "text-end", fixable: true };
  if (base.startsWith("left-") || base.startsWith("right-")) return { fixable: false };
  return null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow physical direction classes (ml-/mr-/left-/right-/text-left/text-right) in RTL; prefer logical utilities.",
      recommended: false,
    },
    fixable: "code",
    hasSuggestions: true,
    schema: [],
    messages: {
      replaceLogical: "Replace '{{from}}' with logical '{{to}}' for RTL.",
      avoidPhysical: "Avoid physical-direction class '{{from}}'; use logical utilities (ms-/me-/text-start/text-end).",
    },
  },
  create(context) {
    return {
      JSXAttribute(node: any) {
        if (!(node.name?.name === "class" || node.name?.name === "className")) return;
        const parsed = extractFromJsxAttribute(node);
        if (!parsed || !parsed.confident) return;
        const classes = parsed.classes;
        const offenders: { token: string; base: string; map: { to?: string; fixable: boolean } }[] = [];
        for (const token of classes) {
          const base = lastSeg(token);
          const map = mapLogical(base);
          if (map) offenders.push({ token, base, map });
        }
        if (!offenders.length) return;

        if (node.value?.type === "Literal" && typeof node.value.value === "string") {
          const orig = String(node.value.value);
          const parts = orig.split(/\s+/).filter(Boolean);
          let changed = false;
          for (let i = 0; i < parts.length; i++) {
            const base = lastSeg(parts[i]);
            const map = mapLogical(base);
            if (map && map.to) {
              parts[i] = withPrefix(parts[i], map.to);
              changed = true;
            }
          }
          const fixed = parts.join(" ");
          // Report each offender; attach fixer once (on first)
          let first = true;
          for (const off of offenders) {
            if (off.map.to) {
              context.report({
                node,
                messageId: "replaceLogical",
                data: { from: off.base, to: off.map.to },
                fix: first && changed ? (fixer) => fixer.replaceText(node.value as any, `"${fixed}"`) : null as any,
              });
              first = false;
            } else {
              context.report({ node, messageId: "avoidPhysical", data: { from: off.base } });
            }
          }
        } else {
          // Non-literal; cannot safely fix. Report offenders individually
          for (const off of offenders) {
            if (off.map.to) {
              context.report({ node, messageId: "replaceLogical", data: { from: off.base, to: off.map.to } });
            } else {
              context.report({ node, messageId: "avoidPhysical", data: { from: off.base } });
            }
          }
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;

