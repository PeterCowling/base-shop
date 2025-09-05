jest.mock("zod", () => {
  const actual = jest.requireActual("zod");
  return {
    ...actual,
    z: { ...actual.z, setErrorMap: jest.fn(actual.z.setErrorMap) },
  };
});
import { z, ZodIssueCode, type ZodIssue } from "zod";
import { applyFriendlyZodMessages, friendlyErrorMap } from "../zodErrorMap";

describe("applyFriendlyZodMessages", () => {
  test("sets the global error map", () => {
    const spy = (z as any).setErrorMap as jest.Mock;
    applyFriendlyZodMessages();
    expect(spy).toHaveBeenCalledWith(friendlyErrorMap);
    const friendlyMsg =
      z.string().safeParse(undefined).error?.issues[0].message;
    expect(friendlyMsg).toBe("Required");
  });
});

describe("friendlyErrorMap", () => {
  const ctx = { defaultError: "Default error", data: undefined } as const;

  test("invalid_type missing field", () => {
    const issue: ZodIssue = {
      code: ZodIssueCode.invalid_type,
      expected: "string",
      received: "undefined",
      path: [],
    };
    expect(friendlyErrorMap(issue, ctx).message).toBe("Required");
  });

  test("invalid_type wrong type", () => {
    const issue: ZodIssue = {
      code: ZodIssueCode.invalid_type,
      expected: "number",
      received: "string",
      path: [],
    };
    expect(friendlyErrorMap(issue, ctx).message).toBe("Expected number");
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
      minimum: 5,
      inclusive: true,
      type: "string",
      path: [],
    } as const;
    expect(friendlyErrorMap(issue, ctx).message).toBe("Must be at least 5 characters");
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

  test("default case with ctx default error", () => {
    const issue = {
      code: ZodIssueCode.custom,
      path: [],
    } as const;
    const customCtx = {
      defaultError: "Ctx default message",
      data: undefined,
    } as const;
    expect(friendlyErrorMap(issue, customCtx).message).toBe(
      "Ctx default message",
    );
  });
});

