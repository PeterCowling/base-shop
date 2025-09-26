import type { Node, Expression, Property } from "estree";
import { getBooleanIfStatic, getStringIfStatic } from "./ast.js";

export type Parsed = { classes: string[]; confident: boolean };

const FN_NAMES = new Set(["clsx", "classnames", "classNames", "cn"]);

function pushTokens(str: string, out: string[]) {
  for (const part of str.split(/\s+/).map((s) => s.trim()).filter(Boolean)) {
    out.push(part);
  }
}

export function isClassnameCallee(callee: Expression): boolean {
  return (
    (callee.type === "Identifier" && FN_NAMES.has(callee.name)) ||
    (callee.type === "MemberExpression" && callee.property.type === "Identifier" && FN_NAMES.has(callee.property.name))
  );
}

export function parseClassnameLikeArg(arg: Expression | null | undefined): Parsed {
  if (!arg) return { classes: [], confident: false };

  // Strings
  const s = getStringIfStatic(arg as Node);
  if (s.confident && s.value != null) {
    const out: string[] = [];
    pushTokens(s.value, out);
    return { classes: out, confident: true };
  }

  // Arrays
  if ((arg as any).type === "ArrayExpression") {
    const out: string[] = [];
    let confident = true;
    for (const el of (arg as any).elements) {
      if (!el) continue;
      if ((el as any).type === "SpreadElement") {
        confident = false;
        continue;
      }
      const child = parseClassnameLikeArg(el as any);
      out.push(...child.classes);
      confident = confident && child.confident;
    }
    return { classes: out, confident };
  }

  // Objects: { "foo": cond, bar: true }
  if ((arg as any).type === "ObjectExpression") {
    const out: string[] = [];
    let confident = true;
    for (const prop of (arg as any).properties as Property[]) {
      if (prop.type !== "Property") {
        confident = false;
        continue;
      }
      // Static key only
      let key: string | undefined;
      if (prop.key.type === "Identifier") key = prop.key.name;
      if (prop.key.type === "Literal" && typeof (prop.key as any).value === "string") key = String((prop.key as any).value);
      if (!key) {
        confident = false;
        continue;
      }
      // Static boolean-like value
      const bv = getBooleanIfStatic(prop.value as any);
      if (!bv.confident) {
        confident = false;
        continue;
      }
      if (bv.value) pushTokens(key, out);
    }
    return { classes: out, confident };
  }

  // Conditional expressions — only include when statically resolvable
  if ((arg as any).type === "ConditionalExpression") {
    const test = getBooleanIfStatic((arg as any).test as Node);
    if (!test.confident) return { classes: [], confident: false };
    return parseClassnameLikeArg(test.value ? (arg as any).consequent : (arg as any).alternate);
  }

  // Nested clsx/classnames/cn calls
  if ((arg as any).type === "CallExpression" && isClassnameCallee((arg as any).callee as any)) {
    let confident = true;
    const out: string[] = [];
    for (const inner of (arg as any).arguments as any[]) {
      const parsed = parseClassnameLikeArg(inner as any);
      out.push(...parsed.classes);
      confident = confident && parsed.confident;
    }
    return { classes: out, confident };
  }

  // Unknown/dynamic
  return { classes: [], confident: false };
}
