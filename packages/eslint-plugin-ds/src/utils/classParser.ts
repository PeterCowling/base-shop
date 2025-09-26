import type { Expression } from "estree";
import { getStringIfStatic, isClassNameAttribute } from "./ast.js";
import { isClassnameCallee, parseClassnameLikeArg, type Parsed } from "./classnames.js";

export type ClassParseResult = Parsed & { source?: any };

export function parseFromExpression(expr: Expression): ClassParseResult {
  // Direct string-ish values
  const s = getStringIfStatic(expr as any);
  if (s.confident && s.value != null) {
    return { classes: splitTokens(s.value), confident: true };
  }

  // clsx/classnames/cn(...)
  if ((expr as any).type === "CallExpression") {
    const callee = (expr as any).callee as Expression;
    if (isClassnameCallee(callee)) {
      let confident = true;
      const out: string[] = [];
      for (const arg of (expr as any).arguments as any[]) {
        const parsed = parseClassnameLikeArg(arg as any);
        out.push(...parsed.classes);
        confident = confident && parsed.confident;
      }
      return { classes: out, confident };
    }

    // cva("base", ...)
    if (callee.type === "Identifier" && callee.name === "cva") {
      const first = (expr as any).arguments?.[0] as Expression | undefined;
      if (first) {
        const base = parseClassnameLikeArg(first);
        if (base.classes.length) return { classes: base.classes, confident: base.confident };
      }
    }
  }

  // Conditional expression at top-level
  if ((expr as any).type === "ConditionalExpression") {
    return parseClassnameLikeArg(expr as any);
  }

  // Array/Object literals
  if ((expr as any).type === "ArrayExpression" || (expr as any).type === "ObjectExpression") {
    return parseClassnameLikeArg(expr as any);
  }

  return { classes: [], confident: false };
}

export function extractFromJsxAttribute(attr: any): ClassParseResult | null {
  if (!isClassNameAttribute(attr)) return null;
  // <div className="..." />
  const value = attr.value;
  if (!value) return { classes: [], confident: true };
  if (value.type === "Literal" && typeof (value as any).value === "string") {
    return { classes: splitTokens(String((value as any).value)), confident: true };
  }
  // <div className={...} />
  if (value.type === "JSXExpressionContainer" && value.expression) {
    return parseFromExpression(value.expression as any);
  }
  return { classes: [], confident: false };
}

function splitTokens(str: string): string[] {
  return str
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
