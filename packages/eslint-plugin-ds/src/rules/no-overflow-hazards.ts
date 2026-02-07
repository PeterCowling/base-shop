import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

const HAZARD_CLASSES = new Set(["w-screen", "overflow-visible"]);

function isAppShell(filename: string): boolean {
  const f = filename.replace(/\\/g, "/");
  if (f.includes("/src/app/")) return true;
  if (/\/_app\.[tj]sx?$/.test(f)) return true;
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Flag overflow hazards like w-screen and overflow-visible outside app shells.",
      recommended: false,
    },
    messages: {
      hazardClass: "Avoid '{{cls}}' outside app/root shells.",
      hazardStyle: "Avoid style '{{prop}}: {{value}}' outside app/root shells.",
    },
    schema: [],
  },
  create(context) {
    const filename = String((context as any).getFilename?.() || "");
    const allowed = isAppShell(filename);

    function reportClass(attr: any) {
      const parsed = extractFromJsxAttribute(attr);
      if (!parsed || !parsed.confident) return;
      for (const c of parsed.classes) {
        if (HAZARD_CLASSES.has(c)) {
          if (!allowed) context.report({ node: attr, messageId: "hazardClass", data: { cls: c } });
      }
        if (/\[(?:[^\]]*?(?:100vw))\]/.test(c)) {
          if (!allowed) context.report({ node: attr, messageId: "hazardClass", data: { cls: c } });
        }
      }
    }

    function reportStyle(attr: any) {
      if (!attr || attr.type !== "JSXAttribute" || attr.name?.name !== "style") return;
      const value = attr.value;
      if (!value || value.type !== "JSXExpressionContainer" || !value.expression) return;
      const expr = value.expression;
      if (expr.type !== "ObjectExpression") return;
      for (const prop of expr.properties) {
        if (prop.type !== "Property") continue;
        const key = prop.key.type === "Identifier" ? prop.key.name : prop.key.type === "Literal" ? String((prop.key as any).value) : undefined;
        if (!key) continue;
        let raw: string | undefined;
        if (prop.value.type === "Literal") raw = String((prop.value as any).value);
        if (typeof raw === "string" && /100vw/.test(raw)) {
          if (!allowed) context.report({ node: prop.value as any, messageId: "hazardStyle", data: { prop: key, value: raw } });
        }
      }
    }

    return {
      JSXAttribute(node: any) {
        if ((node as any).name?.name === "className" || (node as any).name?.name === "class") reportClass(node);
        if ((node as any).name?.name === "style") reportStyle(node);
      },
    } as Rule.RuleListener;
  },
};

export default rule;

