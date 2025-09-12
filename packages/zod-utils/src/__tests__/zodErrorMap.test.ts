import { z, ZodIssueCode, type ZodIssue } from "zod";
import { applyFriendlyZodMessages, friendlyErrorMap } from "../zodErrorMap";

describe("friendlyErrorMap", () => {
  const ctx = { defaultError: "Default error", data: undefined, path: [] } as const;

  test.each<[{ [k: string]: any }, string]>([
    [
      {
        code: ZodIssueCode.invalid_type,
        expected: "string",
        received: "undefined",
        path: [],
      },
      "Required",
    ],
    [
      {
        code: ZodIssueCode.invalid_type,
        expected: "string",
        received: "number",
        path: [],
      },
      "Expected string",
    ],
    [
      {
        code: ZodIssueCode.invalid_enum_value,
        options: ["a", "b"],
        received: "c",
        path: [],
      },
      "Invalid value",
    ],
    [
      {
        code: ZodIssueCode.too_small,
        type: "string",
        minimum: 3,
        inclusive: true,
        exact: false,
        message: "",
        path: [],
      },
      "Must be at least 3 characters",
    ],
    [
      {
        code: ZodIssueCode.too_small,
        type: "array",
        minimum: 2,
        inclusive: true,
        exact: false,
        message: "",
        path: [],
      },
      "Must have at least 2 items",
    ],
    [
      {
        code: ZodIssueCode.too_big,
        type: "string",
        maximum: 5,
        inclusive: true,
        exact: false,
        message: "",
        path: [],
      },
      "Must be at most 5 characters",
    ],
    [
      {
        code: ZodIssueCode.too_big,
        type: "array",
        maximum: 4,
        inclusive: true,
        exact: false,
        message: "",
        path: [],
      },
      "Must have at most 4 items",
    ],
  ])("maps %j to custom message", (issue, expected) => {
    expect(friendlyErrorMap(issue as ZodIssue, ctx).message).toBe(expected);
  });

  test("too_small returns default message for unhandled types", () => {
    const issue = {
      code: ZodIssueCode.too_small,
      type: "number",
      minimum: 1,
      inclusive: true,
      exact: false,
      message: "",
      path: [],
    } as unknown as ZodIssue;
    expect(friendlyErrorMap(issue, ctx).message).toBe(ctx.defaultError);
  });

  test("too_big returns default message for unhandled types", () => {
    const issue = {
      code: ZodIssueCode.too_big,
      type: "number",
      maximum: 1,
      inclusive: true,
      exact: false,
      message: "",
      path: [],
    } as unknown as ZodIssue;
    expect(friendlyErrorMap(issue, ctx).message).toBe(ctx.defaultError);
  });

  test("falls back to default for unknown codes", () => {
    const issue = { code: ZodIssueCode.custom, path: [] } as unknown as ZodIssue;
    expect(friendlyErrorMap(issue, ctx).message).toBe(ctx.defaultError);
  });

  test("uses provided issue.message when available", () => {
    const issue = {
      code: ZodIssueCode.custom,
      message: "Custom message",
      path: [],
    } as unknown as ZodIssue;
    expect(friendlyErrorMap(issue, ctx).message).toBe("Custom message");
  });
});

test("applyFriendlyZodMessages sets global error map", () => {
  const original = z.getErrorMap();
  const schema = z.string().min(3);
  const before = schema.safeParse("hi");
  expect(before.error?.issues[0]?.message).not.toBe(
    "Must be at least 3 characters",
  );

  applyFriendlyZodMessages();
  expect(z.getErrorMap()).toBe(friendlyErrorMap);

  const after = schema.safeParse("hi");
  expect(after.error?.issues[0]?.message).toBe(
    "Must be at least 3 characters",
  );

  z.setErrorMap(original);
});

