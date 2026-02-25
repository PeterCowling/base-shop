import type { Rule } from "eslint";

function findJsxAttribute(openingElement: any, name: string): any | null {
  const attributes = openingElement?.attributes;
  if (!Array.isArray(attributes)) return null;

  for (const attribute of attributes) {
    if (attribute?.type !== "JSXAttribute") continue;
    if (attribute.name?.name === name) return attribute;
  }

  return null;
}

function readBooleanLikeAttribute(attribute: any): boolean | null {
  if (!attribute) return null;

  const valueNode = attribute.value;
  if (!valueNode) return true;

  if (valueNode.type === "Literal") {
    if (typeof valueNode.value === "boolean") return valueNode.value;
    if (typeof valueNode.value === "string") {
      if (valueNode.value === "true") return true;
      if (valueNode.value === "false") return false;
    }
    return null;
  }

  if (valueNode.type === "JSXExpressionContainer") {
    const expression = valueNode.expression;
    if (!expression || expression.type === "JSXEmptyExpression") return null;

    if (expression.type === "Literal") {
      if (typeof expression.value === "boolean") return expression.value;
      if (typeof expression.value === "string") {
        if (expression.value === "true") return true;
        if (expression.value === "false") return false;
      }
    }
  }

  return null;
}

function hasNonWhitespaceTextChildren(openingElement: any): boolean {
  const parentElement = openingElement?.parent;
  if (!parentElement || parentElement.type !== "JSXElement") return false;

  const children = parentElement.children;
  if (!Array.isArray(children)) return false;

  for (const child of children) {
    if (child.type === "JSXText" && child.value.trim().length > 0) {
      return true;
    }

    if (child.type === "JSXExpressionContainer") {
      const expression = child.expression;
      if (expression?.type === "Literal" && typeof expression.value === "string" && expression.value.trim().length > 0) {
        return true;
      }
    }
  }

  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require explicit decorative semantics when using data-ds-contrast-exempt.",
      recommended: false,
    },
    messages: {
      missingAriaHidden:
        "Elements using 'data-ds-contrast-exempt' must set 'aria-hidden={true}'.",
      textContentNotAllowed:
        "Elements using 'data-ds-contrast-exempt' must not render visible text content.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXOpeningElement(node: any) {
        const contrastExemptAttribute = findJsxAttribute(node, "data-ds-contrast-exempt");
        if (!contrastExemptAttribute) return;

        const contrastExemptValue = readBooleanLikeAttribute(contrastExemptAttribute);
        if (contrastExemptValue === false) return;

        const ariaHiddenAttribute = findJsxAttribute(node, "aria-hidden");
        const ariaHiddenValue = readBooleanLikeAttribute(ariaHiddenAttribute);

        if (ariaHiddenValue !== true) {
          context.report({
            node: contrastExemptAttribute,
            messageId: "missingAriaHidden",
          });
        }

        if (hasNonWhitespaceTextChildren(node)) {
          context.report({
            node: contrastExemptAttribute,
            messageId: "textContentNotAllowed",
          });
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
