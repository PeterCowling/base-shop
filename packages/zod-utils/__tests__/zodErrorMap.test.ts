import { z } from "zod";
import { applyFriendlyZodMessages, friendlyErrorMap } from "../src/zodErrorMap";

describe("applyFriendlyZodMessages", () => {
  test("registers the friendly error map", () => {
    const before = z.getErrorMap();
    expect(before).not.toBe(friendlyErrorMap);
    applyFriendlyZodMessages();
    const after = z.getErrorMap();
    expect(after).toBe(friendlyErrorMap);
    z.setErrorMap(before);
  });
});

describe("friendly zod error messages", () => {
  const defaultMap = z.getErrorMap();

  beforeAll(() => {
    applyFriendlyZodMessages();
  });

  afterAll(() => {
    z.setErrorMap(defaultMap);
  });

  test("invalid_type", () => {
    const schema = z.string();
    const result = schema.safeParse(123);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Expected string");
  });

  test("invalid_enum_value", () => {
    const schema = z.enum(["a", "b"]);
    const result = schema.safeParse("c");
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Invalid value");
  });

  test("too_small", () => {
    const schema = z.string().min(3);
    const result = schema.safeParse("hi");
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Must be at least 3 characters");
  });

  test("too_big", () => {
    const schema = z.string().max(2);
    const result = schema.safeParse("toolong");
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Must be at most 2 characters");
  });
});

