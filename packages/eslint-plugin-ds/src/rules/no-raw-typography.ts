import type { Rule } from "eslint";
import { extractFromJsxAttribute } from "../utils/classParser.js";

const TEXT_RE = /^text-\[(.+)\]$/;
const LEADING_RE = /^leading-\[(.+)\]$/;
const TRACKING_RE = /^tracking-\[(.+)\]$/;

function normalizeNumber(n: number) {
  return Number(n.toFixed(3));
}

function mapTextValue(val: string): string | undefined {
  // px or rem
  let rem: number | undefined;
  if (/^\d+(?:\.\d+)?px$/i.test(val)) rem = parseFloat(val) / 16;
  else if (/^\d+(?:\.\d+)?rem$/i.test(val)) rem = parseFloat(val);
  if (rem == null) return undefined;
  const r = normalizeNumber(rem);
  const map: Record<number, string> = {
    0.75: "text-xs",
    0.875: "text-sm",
    1: "text-base",
    1.125: "text-lg",
    1.25: "text-xl",
    1.5: "text-2xl",
    1.875: "text-3xl",
    2.25: "text-4xl",
    3: "text-5xl",
    3.75: "text-6xl",
  };
  return map[r];
}

function mapLeadingValue(val: string): string | undefined {
  // bare number
  const num = parseFloat(val);
  if (!/^[\d.]+$/.test(val) || Number.isNaN(num)) return undefined;
  const r = normalizeNumber(num);
  const map: Record<number, string> = {
    1.0: "leading-none",
    1.25: "leading-tight",
    1.375: "leading-snug",
    1.5: "leading-normal",
    1.625: "leading-relaxed",
    2.0: "leading-loose",
  } as const;
  return map[r];
}

function mapTrackingValue(val: string): string | undefined {
  // em units
  const unit = (val.match(/[a-z%]+$/i)?.[0] || "").toLowerCase();
  if (unit !== "em" && unit !== "") return undefined;
  const num = parseFloat(val);
  if (Number.isNaN(num)) return undefined;
  const r = normalizeNumber(num);
  const map: Record<number, string> = {
    [-0.05]: "tracking-tighter",
    [-0.025]: "tracking-tight",
    0: "tracking-normal",
    0.025: "tracking-wide",
    0.05: "tracking-wider",
    0.1: "tracking-widest",
  } as const;
  return map[r];
}

function classify(cls: string): { kind: "text" | "leading" | "tracking"; value: string } | null {
  let m = cls.match(TEXT_RE);
  if (m) return { kind: "text", value: m[1] };
  m = cls.match(LEADING_RE);
  if (m) return { kind: "leading", value: m[1] };
  m = cls.match(TRACKING_RE);
  if (m) return { kind: "tracking", value: m[1] };
  return null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow arbitrary typography values: text-[..], leading-[..], tracking-[..]",
      recommended: false,
    },
    fixable: "code",
    hasSuggestions: true,
    messages: {
      noRawTypography: "Avoid raw typography '{{raw}}' in '{{kind}}'.{{hint}}",
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
          const info = classify(cls);
          if (!info) continue;
          const { kind, value } = info;
          // ignore tokenized var() usage
          if (/var\(/.test(value)) continue;
          let fixTo: string | undefined;
          if (kind === "text") fixTo = mapTextValue(value);
          else if (kind === "leading") fixTo = mapLeadingValue(value);
          else fixTo = mapTrackingValue(value);

          const hint = fixTo ? ` Use '${fixTo}'.` : "";

          if (fixTo && node.value?.type === "Literal" && typeof node.value.value === "string") {
            // Safe fix for string literal class lists: replace this token only
            const orig = String(node.value.value);
            const replaced = orig.replace(new RegExp(`(?<![^\\s])${escapeRegExp(cls)}(?![^\\s])`, "g"), fixTo);
            if (replaced !== orig) {
              context.report({
                node,
                messageId: "noRawTypography",
                data: { raw: value, kind, hint },
                fix(fixer) {
                  return fixer.replaceText(node.value as any, `"${replaced}"`);
                },
              });
              continue;
            }
          }

          // Otherwise, report without fix
          context.report({ node, messageId: "noRawTypography", data: { raw: value, kind, hint } });
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
