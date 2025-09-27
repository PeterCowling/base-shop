import type { Rule } from "eslint";

function getName(node: any): string | undefined {
  const n = node?.name;
  if (!n) return undefined;
  if (n.type === "JSXIdentifier") return n.name;
  return undefined;
}

function inSvgOrForeignObject(context: Rule.RuleContext, node: any): boolean {
  const ancestors = context.getSourceCode().getAncestors(node as any);
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const a: any = ancestors[i];
    if (a?.type === "JSXElement") {
      const name = getName(a.openingElement);
      if (name === "svg" || name === "foreignObject") return true;
    }
  }
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Forbid raw <img>; prefer framework image components or DS media primitives.",
      recommended: false,
    },
    messages: {
      nakedImg: "Use the DS image component instead of raw <img>.",
    },
    schema: [],
  },
  create(context) {
    const filename = String((context as any).getFilename?.() || "").toLowerCase();
    const isMdx = filename.endsWith(".mdx") || filename.endsWith(".md");

    return {
      JSXOpeningElement(node: any) {
        if (isMdx) return; // allow MDX transforms
        const name = getName(node);
        if (name !== "img") return;
        if (inSvgOrForeignObject(context, node)) return; // allow within <svg>/<foreignObject>
        context.report({ node, messageId: "nakedImg" });
      },
    } as Rule.RuleListener;
  },
};

export default rule;
