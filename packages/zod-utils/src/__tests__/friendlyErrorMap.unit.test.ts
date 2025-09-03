import { z, ZodIssueCode } from "zod";
import { applyFriendlyZodMessages, friendlyErrorMap } from "../zodErrorMap";

describe("applyFriendlyZodMessages", () => {
  test("registers the friendly error map", () => {
    const original = z.getErrorMap();
    expect(original).not.toBe(friendlyErrorMap);
    applyFriendlyZodMessages();
    expect(z.getErrorMap()).toBe(friendlyErrorMap);
    z.setErrorMap(original);
  });
});

describe("friendlyErrorMap", () => {
  const ctx = { defaultError: "Default error", data: undefined } as const;

  test("invalid_type missing field", () => {
    const issue = {
      code: ZodIssueCode.invalid_type,
      expected: "string",
      received: "undefined",
      path: [],
    } as const;
    expect(friendlyErrorMap(issue, ctx).message).toBe("Required");
  });

  test("invalid_type wrong type", () => {
    const issue = {
      code: ZodIssueCode.invalid_type,
      expected: "string",
      received: "number",
      path: [],
    } as const;
    expect(friendlyErrorMap(issue, ctx).message).toBe("Expected string");
  });

  test("invalid_enum_value", () => {
    const issue = {
      code: ZodIssueCode.invalid_enum_value,
      options: ["a", "b"],
      received: "c",
      path: [],
    } as const;
    expect(friendlyErrorMap(issue, ctx).message).toBe("Invalid value");
  });

  test("too_small string", () => {
    const issue = {
      code: ZodIssueCode.too_small,
      minimum: 3,
      inclusive: true,
      type: "string",
      path: [],
    } as const;
    expect(friendlyErrorMap(issue, ctx).message).toBe("Must be at least 3 characters");
  });

  test("too_small array", () => {
    const issue = {
      code: ZodIssueCode.too_small,
      minimum: 2,
      inclusive: true,
      type: "array",
      path: [],
    } as const;
    expect(friendlyErrorMap(issue, ctx).message).toBe("Must have at least 2 items");
  });

  test("too_small number", () => {
    const issue = {
      code: ZodIssueCode.too_small,
      minimum: 3,
      inclusive: true,
      type: "number",
      path: [],
    } as const;
    expect(friendlyErrorMap(issue, ctx)).toEqual({ message: ctx.defaultError });
  });

  test("too_big string", () => {
    const issue = {
      code: ZodIssueCode.too_big,
      maximum: 2,
      inclusive: true,
      type: "string",
      path: [],
    } as const;
    expect(friendlyErrorMap(issue, ctx).message).toBe("Must be at most 2 characters");
  });

  test("too_big array", () => {
    const issue = {
      code: ZodIssueCode.too_big,
      maximum: 2,
      inclusive: true,
      type: "array",
      path: [],
    } as const;
    expect(friendlyErrorMap(issue, ctx).message).toBe("Must have at most 2 items");
  });

  test("too_big number", () => {
    const issue = {
      code: ZodIssueCode.too_big,
      maximum: 2,
      inclusive: true,
      type: "number",
      path: [],
    } as const;
    expect(friendlyErrorMap(issue, ctx)).toEqual({ message: ctx.defaultError });
  });

  test("default case with custom message", () => {
    const issue = {
      code: ZodIssueCode.custom,
      message: "Boom",
      path: [],
    } as const;
    expect(friendlyErrorMap(issue, ctx).message).toBe("Boom");
  });
});

