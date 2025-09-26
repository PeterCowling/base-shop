import type { Rule } from "eslint";
import { extractFromJsxAttribute } from "../utils/classParser.js";

type Options = [
  {
    allowedComponents?: string[]; // component names allowed to manage layout (e.g., Stack, Inline, Grid, Sidebar, Cluster, Cover)
    allowedPaths?: string[]; // regex paths to ignore (infra)
  }?
];

function isLeafJSX(node: any): boolean {
  if (!node || node.type !== "JSXElement") return false;
  const children = (node.children ?? []) as any[];
  return !children.some((c) => c && c.type === "JSXElement");
}

function hasLayoutClass(classes: string[]): { cls: string; kind: "flex" | "grid" } | null {
  for (const cls of classes) {
    const base = cls.split(":").pop() || cls;
    if (base === "flex" || base === "inline-flex") return { cls, kind: "flex" };
    if (base === "grid" || base === "inline-grid") return { cls, kind: "grid" };
  }
  return null;
}

function isNarrowInlineFlex(classes: string[]): boolean {
  // Allow inline-flex when used without gaps/wrap (icon + label style)
  let hasInlineFlex = false;
  for (const cls of classes) {
    const base = cls.split(":").pop() || cls;
    if (base === "inline-flex") hasInlineFlex = true;
    if (/^gap-/.test(base) || base.includes("wrap")) return false;
  }
  return hasInlineFlex;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Disallow applying flex/grid on leaf elements; prefer DS layout primitives. Narrow inline-flex without gap/wrap is allowed.",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          allowedComponents: { type: "array", items: { type: "string" } },
          allowedPaths: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noLeafLayout:
        "Avoid '{{kind}}' layout on leaf elements (class '{{cls}}'). Use DS layout primitives (Stack/Inline/Grid/Sidebar/Cluster/Cover).",
    },
  },
  create(context) {
    const [{ allowedComponents = ["Stack", "Inline", "Grid", "Sidebar", "Cluster", "Cover"], allowedPaths = [] } = {}] =
      context.options as Options;
    const filename = context.getFilename?.() || "";
    const pathAllowed = allowedPaths.some((pat) => {
      try {
        const re = new RegExp(pat);
        return re.test(filename);
      } catch {
        return false;
      }
    });

    return {
      JSXElement(node: any) {
        if (pathAllowed) return;
        const nameNode = node.openingElement?.name;
        const compName = nameNode && nameNode.type === "JSXIdentifier" ? nameNode.name : undefined;
        if (compName && allowedComponents.includes(compName)) return;

        const attrs = node.openingElement?.attributes ?? [];
        const classAttr = attrs.find((a: any) => a?.type === "JSXAttribute" && (a.name?.name === "class" || a.name?.name === "className"));
        if (!classAttr) return;
        const parsed = extractFromJsxAttribute(classAttr);
        if (!parsed || !parsed.confident) return;

        const layout = hasLayoutClass(parsed.classes);
        if (!layout) return;

        // Permit narrow inline-flex without gap/wrap
        if (layout.kind === "flex" && isNarrowInlineFlex(parsed.classes)) return;

        // Only apply to leaf elements
        if (!isLeafJSX(node)) return;

        context.report({ node: classAttr as any, messageId: "noLeafLayout", data: { cls: layout.cls, kind: layout.kind } });
      },
    } as Rule.RuleListener;
  },
};

export default rule;
