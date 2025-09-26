import type { Rule } from "eslint";
import { extractFromJsxAttribute } from "../utils/classParser.js";

function lastSeg(token: string): string {
  const i = token.lastIndexOf(":");
  return i >= 0 ? token.slice(i + 1) : token;
}

function parseScaleNum(base: string, prefixes: string[]): number | null {
  for (const p of prefixes) {
    if (base.startsWith(p)) {
      const n = base.slice(p.length);
      const num = Number(n);
      return Number.isFinite(num) ? num : null;
    }
  }
  return null;
}

function toPxFromScale(num: number): number {
  // Tailwind scale unit ~ 0.25rem = 4px (assuming 16px root)
  return num * 4;
}

function isInteractive(name: any, attrs: any[]): boolean {
  const tag = name?.type === "JSXIdentifier" ? name.name : undefined;
  if (!tag) return false;
  if (tag === "button" || tag === "a") return true;
  if (tag === "input") {
    const type = attrs.find((a: any) => a.type === "JSXAttribute" && a.name?.name === "type");
    const v = type?.value?.type === "Literal" ? String(type.value.value || "") : "";
    return ["button", "submit", "reset", "checkbox", "radio"].includes(v);
  }
  return false;
}

type Options = [{ min?: number }];

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Ensure interactive elements meet minimum tap target size",
      recommended: false,
    },
    schema: [{ type: "object", properties: { min: { type: "number" } }, additionalProperties: false }],
    messages: {
      tooSmall: "Interactive element tap target is under {{min}}px. Use DS tokenized size (e.g., size-10 or min-h-10 min-w-10).",
    },
  },
  create(context) {
    const [{ min = 40 } = {}] = context.options as Options;
    return {
      JSXOpeningElement(node: any) {
        if (!isInteractive(node.name, node.attributes)) return;
        const classAttr = node.attributes?.find(
          (a: any) => a.type === "JSXAttribute" && (a.name?.name === "class" || a.name?.name === "className"),
        );
        if (!classAttr) return;
        const parsed = extractFromJsxAttribute(classAttr);
        if (!parsed || !parsed.confident) return;
        const classes = parsed.classes;

        let sizePx: number | null = null;
        let minHPx: number | null = null;
        let minWPx: number | null = null;
        for (const token of classes) {
          const base = lastSeg(token);
          const size = parseScaleNum(base, ["size-"]);
          if (size != null) sizePx = Math.max(sizePx ?? 0, toPxFromScale(size));
          const h = parseScaleNum(base, ["h-", "min-h-"]);
          if (h != null) minHPx = Math.max(minHPx ?? 0, toPxFromScale(h));
          const w = parseScaleNum(base, ["w-", "min-w-"]);
          if (w != null) minWPx = Math.max(minWPx ?? 0, toPxFromScale(w));
        }
        let ok = false;
        if (sizePx != null) ok = sizePx >= min;
        else if (minHPx != null && minWPx != null) ok = minHPx >= min && minWPx >= min;
        if (!ok) {
          context.report({ node: classAttr ?? node, messageId: "tooSmall", data: { min: String(min) } });
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
