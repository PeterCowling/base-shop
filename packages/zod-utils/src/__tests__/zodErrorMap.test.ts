import { z, ZodIssueCode, type ZodIssue } from "zod";
import { applyFriendlyZodMessages, friendlyErrorMap } from "../zodErrorMap";

describe("friendlyErrorMap", () => {
  const ctx = { defaultError: "fallback", data: undefined, path: [] };

  test("invalid_type", () => {
    const issues: ZodIssue[] = [
      {
        code: ZodIssueCode.invalid_type,
        expected: "string",
        received: "undefined",
        path: [],
      } as unknown as ZodIssue,
      {
        code: ZodIssueCode.invalid_type,
        expected: "string",
        received: "number",
        path: [],
      } as unknown as ZodIssue,
    ];

    const messages = issues.map((issue) => friendlyErrorMap(issue, ctx).message);
    expect(messages).toEqual(["Required", "Expected string"]);
  });

  test("invalid_enum_value", () => {
    const issue = {
      code: ZodIssueCode.invalid_enum_value,
      options: ["a", "b"],
      received: "c",
      path: [],
    } as unknown as ZodIssue;

    expect(friendlyErrorMap(issue, ctx).message).toBe("Invalid value");
  });

  test("too_small", () => {
    const issues: ZodIssue[] = [
      {
        code: ZodIssueCode.too_small,
        type: "string",
        minimum: 3,
        inclusive: true,
        exact: false,
        message: "",
        path: [],
      } as unknown as ZodIssue,
      {
        code: ZodIssueCode.too_small,
        type: "array",
        minimum: 2,
        inclusive: true,
        exact: false,
        message: "",
        path: [],
      } as unknown as ZodIssue,
      {
        code: ZodIssueCode.too_small,
        type: "number",
        minimum: 1,
        inclusive: true,
        exact: false,
        message: "",
        path: [],
      } as unknown as ZodIssue,
    ];

    const messages = issues.map((issue) => friendlyErrorMap(issue, ctx).message);
    expect(messages).toEqual([
      "Must be at least 3 characters",
      "Must have at least 2 items",
      ctx.defaultError,
    ]);
  });

  test("too_big", () => {
    const issues: ZodIssue[] = [
      {
        code: ZodIssueCode.too_big,
        type: "string",
        maximum: 5,
        inclusive: true,
        exact: false,
        message: "",
        path: [],
      } as unknown as ZodIssue,
      {
        code: ZodIssueCode.too_big,
        type: "array",
        maximum: 4,
        inclusive: true,
        exact: false,
        message: "",
        path: [],
      } as unknown as ZodIssue,
      {
        code: ZodIssueCode.too_big,
        type: "number",
        maximum: 1,
        inclusive: true,
        exact: false,
        message: "",
        path: [],
      } as unknown as ZodIssue,
    ];

    const messages = issues.map((issue) => friendlyErrorMap(issue, ctx).message);
    expect(messages).toEqual([
      "Must be at most 5 characters",
      "Must have at most 4 items",
      ctx.defaultError,
    ]);
  });

  test("unknown issue", () => {
    const issues: ZodIssue[] = [
      {
        code: ZodIssueCode.custom,
        message: "Custom message",
        path: [],
      } as unknown as ZodIssue,
      {
        code: ZodIssueCode.custom,
        path: [],
      } as unknown as ZodIssue,
    ];

    const messages = issues.map((issue) => friendlyErrorMap(issue, ctx).message);
    expect(messages).toEqual(["Custom message", ctx.defaultError]);
  });
});

test("applyFriendlyZodMessages sets global error map", () => {
  const original = z.getErrorMap();
  const schema = z.string().min(3);

  const before = schema.safeParse("hi");
  expect(before.error.issues[0].message).not.toBe("Must be at least 3 characters");

  applyFriendlyZodMessages();
  const after = schema.safeParse("hi");
  expect(after.error.issues[0].message).toBe("Must be at least 3 characters");

  z.setErrorMap(original);
});

