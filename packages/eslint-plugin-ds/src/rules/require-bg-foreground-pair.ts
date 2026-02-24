import type { Rule } from "eslint";

import { isClassnameCallee } from "../utils/classnames.js";
import { extractFromJsxAttribute } from "../utils/classParser.js";

const BACKGROUND_TO_ALLOWED_FOREGROUNDS: Record<string, readonly string[]> = {
  "bg-primary": ["text-primary-foreground", "text-primary-fg", "text-brand-on-primary"],
  "bg-accent": ["text-accent-foreground", "text-accent-fg"],
  "bg-success": ["text-success-foreground", "text-success-fg"],
  "bg-info": ["text-info-foreground", "text-info-fg"],
  "bg-warning": ["text-warning-foreground", "text-warning-fg"],
  "bg-danger": ["text-danger-foreground", "text-danger-fg"],
  "bg-destructive": ["text-destructive-foreground", "text-danger-foreground", "text-danger-fg"],
};

const STATEFUL_VARIANT_PREFIXES = new Set([
  "hover",
  "focus",
  "focus-visible",
  "focus-within",
  "active",
  "disabled",
  "visited",
  "group-hover",
  "group-focus",
  "peer-hover",
  "peer-focus",
  "motion-safe",
  "motion-reduce",
  "dark",
]);

function normalizeClassToken(token: string): { base: string; variants: string[] } | null {
  if (!token) return null;

  const withoutImportant = token.startsWith("!") ? token.slice(1) : token;
  const parts = withoutImportant.split(":");
  const rawBase = parts[parts.length - 1];

  if (!rawBase) return null;

  const base = rawBase.replace(/\/[0-9]{1,3}$/u, "");
  return {
    base,
    variants: parts.slice(0, -1),
  };
}

function shouldSkipByVariants(variants: readonly string[]): boolean {
  return variants.some((variant) => STATEFUL_VARIANT_PREFIXES.has(variant));
}

function splitTokens(value: string): string[] {
  return value
    .split(/\s+/u)
    .map((token) => token.trim())
    .filter(Boolean);
}

function hasContrastExemptAttribute(openingElement: any): boolean {
  const attributes = openingElement?.attributes;
  if (!Array.isArray(attributes)) return false;

  for (const attribute of attributes) {
    if (attribute?.type !== "JSXAttribute") continue;
    if (attribute.name?.name !== "data-ds-contrast-exempt") continue;

    const valueNode = attribute.value;
    if (!valueNode) return true;

    if (valueNode.type === "Literal") {
      if (typeof valueNode.value === "boolean") return valueNode.value;
      if (typeof valueNode.value === "string") return valueNode.value !== "false";
      return true;
    }

    if (valueNode.type === "JSXExpressionContainer") {
      const expression = valueNode.expression;
      if (expression?.type === "Literal") {
        if (typeof expression.value === "boolean") return expression.value;
        if (typeof expression.value === "string") return expression.value !== "false";
      }
      return true;
    }

    return true;
  }

  return false;
}

function pushStaticKeyClassesFromObjectKey(key: any, out: string[]): void {
  if (key?.type === "Identifier") {
    out.push(...splitTokens(key.name));
    return;
  }

  if (key?.type === "Literal" && typeof key.value === "string") {
    out.push(...splitTokens(key.value));
  }
}

function collectPossibleClassesFromExpression(expr: any, out: string[]): void {
  if (!expr) return;

  if (expr.type === "Literal" && typeof expr.value === "string") {
    out.push(...splitTokens(expr.value));
    return;
  }

  if (expr.type === "TemplateLiteral") {
    for (const quasi of expr.quasis ?? []) {
      out.push(...splitTokens(quasi.value?.raw ?? ""));
    }
    return;
  }

  if (expr.type === "ArrayExpression") {
    for (const element of expr.elements ?? []) {
      if (!element || element.type === "SpreadElement") continue;
      collectPossibleClassesFromExpression(element, out);
    }
    return;
  }

  if (expr.type === "ConditionalExpression") {
    collectPossibleClassesFromExpression(expr.consequent, out);
    collectPossibleClassesFromExpression(expr.alternate, out);
    return;
  }

  if (expr.type === "LogicalExpression") {
    collectPossibleClassesFromExpression(expr.left, out);
    collectPossibleClassesFromExpression(expr.right, out);
    return;
  }

  if (expr.type === "ObjectExpression") {
    for (const property of expr.properties ?? []) {
      if (property.type !== "Property") continue;
      pushStaticKeyClassesFromObjectKey(property.key, out);
      collectPossibleClassesFromExpression(property.value, out);
    }
    return;
  }

  if (expr.type === "CallExpression") {
    if (isClassnameCallee(expr.callee)) {
      for (const arg of expr.arguments ?? []) {
        if (arg?.type === "SpreadElement") continue;
        collectPossibleClassesFromExpression(arg, out);
      }
      return;
    }

    for (const arg of expr.arguments ?? []) {
      if (arg?.type === "SpreadElement") continue;
      collectPossibleClassesFromExpression(arg, out);
    }
  }
}

function collectPossibleClassesFromAttribute(node: any): string[] {
  const valueNode = node?.value;
  if (!valueNode) return [];

  if (valueNode.type === "Literal" && typeof valueNode.value === "string") {
    return splitTokens(valueNode.value);
  }

  if (valueNode.type !== "JSXExpressionContainer" || !valueNode.expression) {
    return [];
  }

  const classes: string[] = [];
  collectPossibleClassesFromExpression(valueNode.expression, classes);
  return classes;
}

function checkTokens(tokens: string[], node: any, context: Rule.RuleContext): void {
  if (tokens.length === 0) return;

  const normalizedTokens = tokens
    .map((token) => normalizeClassToken(token))
    .filter((token): token is { base: string; variants: string[] } => token !== null);

  if (normalizedTokens.length === 0) return;

  const textClasses = new Set(
    normalizedTokens
      .filter((token) => token.base.startsWith("text-"))
      .map((token) => token.base)
  );

  const reportedBackgrounds = new Set<string>();

  for (const token of normalizedTokens) {
    const allowedForegrounds = BACKGROUND_TO_ALLOWED_FOREGROUNDS[token.base];
    if (!allowedForegrounds) continue;
    if (shouldSkipByVariants(token.variants)) continue;
    if (reportedBackgrounds.has(token.base)) continue;

    const hasAllowedForeground = allowedForegrounds.some((foreground) => textClasses.has(foreground));
    if (hasAllowedForeground) continue;

    reportedBackgrounds.add(token.base);
    context.report({
      node,
      messageId: "missingForegroundPair",
      data: {
        background: token.base,
        required: allowedForegrounds.join(", "),
      },
    });
  }
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Require approved text foreground tokens alongside critical background tokens to reduce contrast regressions.",
      recommended: false,
    },
    messages: {
      missingForegroundPair:
        "Background class '{{background}}' requires one of: {{required}}.",
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node: any) {
        if (!(node.name?.name === "class" || node.name?.name === "className")) return;
        const openingElement = node.parent;
        if (hasContrastExemptAttribute(openingElement)) return;

        const parsed = extractFromJsxAttribute(node);
        if (!parsed) return;

        const classes = [
          ...parsed.classes,
          ...(!parsed.confident ? collectPossibleClassesFromAttribute(node) : []),
        ].filter(Boolean);
        if (classes.length === 0) return;

        const hasCriticalBackground = classes.some((token) => {
          const normalized = normalizeClassToken(token);
          return normalized ? Boolean(BACKGROUND_TO_ALLOWED_FOREGROUNDS[normalized.base]) : false;
        });
        if (!hasCriticalBackground) return;

        checkTokens(classes, node, context);
      },
    } as Rule.RuleListener;
  },
};

export default rule;
