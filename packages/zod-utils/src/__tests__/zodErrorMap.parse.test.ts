import { z, type ZodError } from "zod";

import { applyFriendlyZodMessages,friendlyErrorMap } from "../zodErrorMap";

describe("friendlyErrorMap with parse errors", () => {
  const ctx = { defaultError: "fallback", data: undefined } as const;

  test("invalid_type missing value", () => {
    const schema = z.string();
    let issue;
    try {
      schema.parse(undefined);
    } catch (err) {
      issue = (err as ZodError).issues[0];
    }
    expect(friendlyErrorMap(issue!, ctx).message).toBe("Required");
  });

  test("invalid_enum_value", () => {
    const schema = z.enum(["a", "b"]);
    let issue;
    try {
      schema.parse("c");
    } catch (err) {
      issue = (err as ZodError).issues[0];
    }
    expect(friendlyErrorMap(issue!, ctx).message).toBe("Invalid value");
  });

  test("too_small string", () => {
    const schema = z.string().min(5);
    let issue;
    try {
      schema.parse("hi");
    } catch (err) {
      issue = (err as ZodError).issues[0];
    }
    expect(friendlyErrorMap(issue!, ctx).message).toBe(
      "Must be at least 5 characters"
    );
  });

  test("too_small array", () => {
    const schema = z.array(z.number()).min(2);
    let issue;
    try {
      schema.parse([1]);
    } catch (err) {
      issue = (err as ZodError).issues[0];
    }
    expect(friendlyErrorMap(issue!, ctx).message).toBe(
      "Must have at least 2 items"
    );
  });

  test("too_big string", () => {
    const schema = z.string().max(1);
    let issue;
    try {
      schema.parse("abc");
    } catch (err) {
      issue = (err as ZodError).issues[0];
    }
    expect(friendlyErrorMap(issue!, ctx).message).toBe(
      "Must be at most 1 characters"
    );
  });

  test("too_big array", () => {
    const schema = z.array(z.string()).max(1);
    let issue;
    try {
      schema.parse(["a", "b"]);
    } catch (err) {
      issue = (err as ZodError).issues[0];
    }
    expect(friendlyErrorMap(issue!, ctx).message).toBe(
      "Must have at most 1 items"
    );
  });
});

describe("applyFriendlyZodMessages overrides global map", () => {
  test("parsing uses friendly messages", () => {
    const schema = z.string().min(3);
    const original = z.getErrorMap();

    let before;
    try {
      schema.parse("hi");
    } catch (err) {
      before = (err as ZodError).issues[0].message;
    }
    expect(before).not.toBe("Must be at least 3 characters");

    applyFriendlyZodMessages();

    try {
      schema.parse("hi");
    } catch (err) {
      expect((err as ZodError).issues[0].message).toBe(
        "Must be at least 3 characters"
      );
    }

    z.setErrorMap(original);
  });
});
