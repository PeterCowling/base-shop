 
import type { Rule } from "eslint";

const MSG_ID = "require-icon-size" as const;

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce size=\"icon\" on Button components that contain only an icon (svg or *Icon). Prevents too-small hit targets and clipped icons.",
    },
    messages: {
      [MSG_ID]:
        "Button with only an icon must set size=\"icon\" (or use IconButton).",
    },
    schema: [],
  },
  create(context) {
    function isButtonJSX(node: any): boolean {
      if (!node || node.type !== "JSXOpeningElement") return false;
      const n = node.name;
      return n?.type === "JSXIdentifier" && n.name === "Button";
    }

    function hasSizeIconAttr(node: any): boolean {
      const attrs: any[] = node.attributes ?? [];
      for (const a of attrs) {
        if (a.type !== "JSXAttribute") continue;
        if (a.name?.name !== "size") continue;
        const v = a.value;
        if (!v) return false;
        if (v.type === "Literal" && v.value === "icon") return true;
        if (v.type === "JSXExpressionContainer" && v.expression.type === "Literal" && v.expression.value === "icon") return true;
      }
      return false;
    }

    function isIconLike(child: any): boolean {
      if (child.type === "JSXElement") {
        const nm = child.openingElement?.name;
        if (nm?.type === "JSXIdentifier") {
          const n = nm.name;
          return n === "svg" || /Icon$/.test(n);
        }
      }
      if (child.type === "JSXExpressionContainer") return isIconLike(child.expression);
      return false;
    }

    function hasMeaningfulText(child: any): boolean {
      if (child.type === "JSXText") return child.value.trim().length > 0;
      if (child.type === "JSXExpressionContainer") return false;
      return false;
    }

    return {
      JSXElement(node: any) {
        const opening = node.openingElement;
        if (!isButtonJSX(opening)) return;
        // collect children that are not whitespace
        const children = (node.children ?? []).filter(
          (c: any) => !(c.type === "JSXText" && c.value.trim() === "")
        );
        if (children.length === 0) return; // no opinion
        const hasIcon = children.every((c: any) => isIconLike(c) || (c.type === "JSXFragment" && (c.children ?? []).every(isIconLike)) || (c.type === "JSXElement" && isIconLike(c)));
        const hasText = children.some(hasMeaningfulText);
        if (hasIcon && !hasText && !hasSizeIconAttr(opening)) {
          context.report({ node: opening, messageId: MSG_ID });
        }
      },
    };
  },
};

export default rule;

