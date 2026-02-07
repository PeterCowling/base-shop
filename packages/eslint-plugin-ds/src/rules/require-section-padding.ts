import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

type Options = [
  {
    min?: number;
    components?: string[];
  }?
];

const PADDING_KEYS = ["p-", "px-", "py-", "pt-", "pr-", "pb-", "pl-"] as const;

function parsePaddingValue(raw: string): number | null {
  if (raw.startsWith("[")) {
    return Number.POSITIVE_INFINITY;
  }
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Ensure Section components using padding='none' still declare sufficient padding utilities.",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          min: { type: "number" },
          components: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      missingPadding:
        "Section uses padding=\"none\" without base padding utilities. Add p-/px-/py- classes at or above {{min}}.",
    },
  },
  create(context) {
    const [{ min = 4, components = ["Section"] } = {}] = context.options as Options;

    return {
      JSXOpeningElement(node: any) {
        const name = node.name?.type === "JSXIdentifier" ? node.name.name : undefined;
        if (!name || !components.includes(name)) return;

        const paddingAttr = node.attributes?.find(
          (attr: any) => attr.type === "JSXAttribute" && attr.name?.name === "padding",
        );
        if (!paddingAttr) return;
        const paddingValue =
          paddingAttr.value?.type === "Literal" ? String(paddingAttr.value.value) : undefined;
        if (paddingValue !== "none") return;

        const classAttr = node.attributes?.find(
          (attr: any) =>
            attr.type === "JSXAttribute" && (attr.name?.name === "className" || attr.name?.name === "class"),
        );
        if (!classAttr) {
          context.report({ node, messageId: "missingPadding", data: { min: String(min) } });
          return;
        }

        const parsed = extractFromJsxAttribute(classAttr);
        if (!parsed || !parsed.confident) return;

        let full: number | null = null;
        let horizontal: number | null = null;
        let left: number | null = null;
        let right: number | null = null;

        for (const token of parsed.classes) {
          if (token.includes(":")) continue;
          const base = token;
          const prefix = PADDING_KEYS.find((key) => base.startsWith(key));
          if (!prefix) continue;

          const value = base.slice(prefix.length);
          const parsedValue = parsePaddingValue(value);
          if (parsedValue == null) continue;

          switch (prefix) {
            case "p-":
              full = Math.max(full ?? 0, parsedValue);
              break;
            case "px-":
              horizontal = Math.max(horizontal ?? 0, parsedValue);
              break;
            case "pl-":
              left = Math.max(left ?? 0, parsedValue);
              break;
            case "pr-":
              right = Math.max(right ?? 0, parsedValue);
              break;
            default:
              break;
          }
        }

        const horizontalValue =
          horizontal ?? (left != null && right != null ? Math.min(left, right) : null);

        const hasEnough = (full != null && full >= min) || (horizontalValue != null && horizontalValue >= min);

        if (!hasEnough) {
          context.report({ node: classAttr ?? node, messageId: "missingPadding", data: { min: String(min) } });
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
