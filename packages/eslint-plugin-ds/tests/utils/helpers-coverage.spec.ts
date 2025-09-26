import { describe, it, expect } from "@jest/globals";

import { isStringLiteral, getStringIfStatic, getBooleanIfStatic, isClassNameAttribute } from "../../src/utils/ast";
import { isClassnameCallee, parseClassnameLikeArg } from "../../src/utils/classnames";
import { parseFromExpression, extractFromJsxAttribute } from "../../src/utils/classParser";

// These targeted unit tests ensure 100% branch coverage of helper utilities.

describe("utils/ast", () => {
  it("string helpers", () => {
    expect(isStringLiteral({ type: "Literal", value: "x" } as any)).toBe(true);
    expect(isStringLiteral({ type: "Literal", value: 1 } as any)).toBe(false);

    expect(getStringIfStatic(null as any).confident).toBe(false);
    expect(getStringIfStatic({ type: "Literal", value: "a" } as any)).toEqual({ value: "a", confident: true });
    expect(getStringIfStatic({ type: "TemplateLiteral", quasis: [{ value: { cooked: "x", raw: "x" } }], expressions: [] } as any)).toEqual({ value: "x", confident: true });
    // Force raw branch (cooked undefined)
    expect(getStringIfStatic({ type: "TemplateLiteral", quasis: [{ value: { cooked: undefined, raw: "y" } }], expressions: [] } as any)).toEqual({ value: "y", confident: true });
    // Binary both static
    expect(
      getStringIfStatic({ type: "BinaryExpression", operator: "+", left: { type: "Literal", value: "a" }, right: { type: "Literal", value: "b" } } as any)
    ).toEqual({ value: "ab", confident: true });
    // Binary not confident
    expect(
      getStringIfStatic({ type: "BinaryExpression", operator: "+", left: { type: "Literal", value: "a" }, right: { type: "Identifier", name: "x" } } as any).confident
    ).toBe(false);
  });

  it("boolean helpers", () => {
    expect(getBooleanIfStatic(null as any).confident).toBe(false);
    expect(getBooleanIfStatic({ type: "Literal", value: true } as any)).toEqual({ value: true, confident: true });
    expect(getBooleanIfStatic({ type: "Literal", value: false } as any)).toEqual({ value: false, confident: true });
    expect(getBooleanIfStatic({ type: "UnaryExpression", operator: "!", argument: { type: "Literal", value: true } } as any)).toEqual({ value: false, confident: true });
    expect(getBooleanIfStatic({ type: "Identifier", name: "x" } as any).confident).toBe(false);
    // Unary with non-confident inner
    expect(getBooleanIfStatic({ type: "UnaryExpression", operator: "!", argument: { type: "Identifier", name: "x" } } as any).confident).toBe(false);
  });

  it("className attribute guard", () => {
    expect(isClassNameAttribute({ type: "JSXAttribute", name: { name: "className" } } as any)).toBe(true);
    expect(isClassNameAttribute({ type: "JSXAttribute", name: { name: "id" } } as any)).toBe(false);
  });
});

describe("utils/classnames", () => {
  it("callee detection", () => {
    for (const n of ["clsx", "classnames", "classNames", "cn"]) {
      expect(isClassnameCallee({ type: "Identifier", name: n } as any)).toBe(true);
      expect(isClassnameCallee({ type: "MemberExpression", object: { type: "Identifier", name: "x" }, property: { type: "Identifier", name: n } } as any)).toBe(true);
    }
    expect(isClassnameCallee({ type: "Identifier", name: "noop" } as any)).toBe(false);
  });

  it("args parsing branches", () => {
    expect(parseClassnameLikeArg(null as any).confident).toBe(false);
    expect(parseClassnameLikeArg({ type: "Literal", value: "a b" } as any)).toEqual({ classes: ["a", "b"], confident: true });
    // Arrays and spreads
    expect(
      parseClassnameLikeArg({ type: "ArrayExpression", elements: [{ type: "Literal", value: "x" } as any, { type: "SpreadElement" } as any] } as any)
    ).toEqual({ classes: ["x"], confident: false });
    // Array with empty element
    expect(
      parseClassnameLikeArg({ type: "ArrayExpression", elements: [null] } as any)
    ).toEqual({ classes: [], confident: true });
    // Objects keys and values
    expect(
      parseClassnameLikeArg({ type: "ObjectExpression", properties: [{ type: "Property", key: { type: "Identifier", name: "x" }, value: { type: "Literal", value: true }, kind: "init" }] } as any)
    ).toEqual({ classes: ["x"], confident: true });
    expect(
      parseClassnameLikeArg({ type: "ObjectExpression", properties: [{ type: "Property", key: { type: "Literal", value: 1 }, value: { type: "Literal", value: true }, kind: "init" }] } as any).confident
    ).toBe(false);
    // Object spread element
    expect(
      parseClassnameLikeArg({ type: "ObjectExpression", properties: [{ type: "SpreadElement" } as any] } as any)
    ).toEqual({ classes: [], confident: false });
    expect(
      parseClassnameLikeArg({ type: "ObjectExpression", properties: [{ type: "Property", key: { type: "Literal", value: "y" }, value: { type: "Identifier", name: "cond" }, kind: "init" }] } as any).confident
    ).toBe(false);
    // Conditional not confident
    expect(
      parseClassnameLikeArg({ type: "ConditionalExpression", test: { type: "Identifier", name: "x" }, consequent: { type: "Literal", value: "a" }, alternate: { type: "Literal", value: "b" } } as any).confident
    ).toBe(false);
  });
});

describe("utils/classParser", () => {
  it("parseFromExpression top-level cases", () => {
    expect(parseFromExpression({ type: "Literal", value: "a b" } as any)).toEqual({ classes: ["a", "b"], confident: true });
    expect(parseFromExpression({ type: "ArrayExpression", elements: [{ type: "Literal", value: "x" }] } as any)).toEqual({ classes: ["x"], confident: true });
    expect(parseFromExpression({ type: "ObjectExpression", properties: [] } as any)).toEqual({ classes: [], confident: true });
    expect(parseFromExpression({ type: "ConditionalExpression", test: { type: "Literal", value: false }, consequent: { type: "Literal", value: "a" }, alternate: { type: "Literal", value: "b" } } as any)).toEqual({ classes: ["b"], confident: true });
    expect(
      parseFromExpression({ type: "CallExpression", callee: { type: "Identifier", name: "cva" }, arguments: [{ type: "Literal", value: "base" }] } as any)
    ).toEqual({ classes: ["base"], confident: true });
    // Unknown identifier
    expect(parseFromExpression({ type: "Identifier", name: "x" } as any).confident).toBe(false);
  });

  it("extractFromJsxAttribute branches", () => {
    expect(extractFromJsxAttribute({ type: "JSXAttribute", name: { name: "id" }, value: null } as any)).toBe(null);
    expect(extractFromJsxAttribute({ type: "JSXAttribute", name: { name: "className" }, value: null } as any)).toEqual({ classes: [], confident: true });
    expect(
      extractFromJsxAttribute({ type: "JSXAttribute", name: { name: "className" }, value: { type: "Literal", value: "a b" } } as any)
    ).toEqual({ classes: ["a", "b"], confident: true });
    expect(
      extractFromJsxAttribute({ type: "JSXAttribute", name: { name: "className" }, value: { type: "JSXExpressionContainer", expression: null } } as any)
    ).toEqual({ classes: [], confident: false });
  });
});
