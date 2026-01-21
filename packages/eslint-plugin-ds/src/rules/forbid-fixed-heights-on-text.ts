import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

const HEAD_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p"]);

function lastSegment(token: string): string {
  const i = token.lastIndexOf(":");
  return i >= 0 ? token.slice(i + 1) : token;
}

function hasClamp(classes: string[]): boolean {
  return classes.some((c) => lastSegment(c).startsWith("line-clamp-"));
}

function isHeadTag(name: any): boolean {
  return !!name && name.type === "JSXIdentifier" && HEAD_TAGS.has(name.name);
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow fixed heights on headings/paragraphs (Tailwind h-* or style.height) unless text is line-clamped.",
      recommended: false,
    },
    schema: [],
    messages: {
      noFixedHeightClass:
        "Avoid fixed height '{{cls}}' on {{tag}}; remove it or use line-clamp for truncation.",
      noFixedHeightStyle:
        "Avoid inline style.height on {{tag}}; remove it or use line-clamp for truncation.",
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node: any) {
        if (!isHeadTag(node.name)) return;
        const tag = node.name.name;

        // Find class/className
        const classAttr = node.attributes?.find(
          (a: any) => a.type === "JSXAttribute" && (a.name.name === "class" || a.name.name === "className"),
        );

        let classes: string[] = [];
        let confident = false;
        if (classAttr) {
          const parsed = extractFromJsxAttribute(classAttr);
          if (parsed) {
            classes = parsed.classes;
            confident = parsed.confident;
          }
        }

        const clamped = hasClamp(classes);

        // Report fixed height classes when determinable and not clamped
        if (classAttr && confident && !clamped) {
          for (const c of classes) {
            const base = lastSegment(c);
            if (base.startsWith("h-")) {
              context.report({
                node: classAttr,
                messageId: "noFixedHeightClass",
                data: { cls: base, tag },
              });
              break; // single report per attribute
            }
          }
        }

        // Check inline style height
        const styleAttr = node.attributes?.find(
          (a: any) => a.type === "JSXAttribute" && a.name?.name === "style",
        );
        if (styleAttr && !clamped) {
          const val = styleAttr.value;
          if (val && val.type === "JSXExpressionContainer" && val.expression?.type === "ObjectExpression") {
            for (const prop of val.expression.properties as any[]) {
              if (prop.type !== "Property") continue;
              let key: string | undefined;
              if (prop.key.type === "Identifier") key = prop.key.name;
              if (prop.key.type === "Literal" && typeof prop.key.value === "string") key = String(prop.key.value);
              if (key === "height") {
                context.report({ node: prop, messageId: "noFixedHeightStyle", data: { tag } });
                break;
              }
            }
          }
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
