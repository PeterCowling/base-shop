import type { Rule } from "eslint";

import { extractFromJsxAttribute } from "../utils/classParser.js";

type Options = [
  {
    allowedComponents?: string[]; // e.g., ["Page", "Section", "Container", "Overlay"]
    allowedPaths?: string[]; // regex strings to ignore
  }?
];

function hasMaxWidth(classes: string[]): string | null {
  for (const cls of classes) {
    const base = cls.split(":").pop() || cls;
    if (base.startsWith("max-w-")) return cls;
  }
  return null;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Restrict max-w-* utilities to container primitives (Page/Section/Container/Overlay).",
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
      onlyInContainers: "Use of '{{cls}}' is restricted to container primitives (Page/Section/Container/Overlay).",
    },
  },
  create(context) {
    const [{ allowedComponents = ["Page", "Section", "Container", "Overlay"], allowedPaths = [] } = {}] =
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

        const attrs = node.openingElement?.attributes ?? [];
        const classAttr = attrs.find((a: any) => a?.type === "JSXAttribute" && (a.name?.name === "class" || a.name?.name === "className"));
        if (!classAttr) return;
        const parsed = extractFromJsxAttribute(classAttr);
        if (!parsed || !parsed.confident) return;

        const hit = hasMaxWidth(parsed.classes);
        if (!hit) return;

        if (compName && allowedComponents.includes(compName)) return;

        context.report({ node: classAttr as any, messageId: "onlyInContainers", data: { cls: hit } });
      },
    } as Rule.RuleListener;
  },
};

export default rule;
