import { z } from "zod";
import { applyFriendlyZodMessages } from "../zodErrorMap";

describe("friendly zod error messages", () => {
  const defaultMap = z.getErrorMap();

  beforeAll(() => {
    applyFriendlyZodMessages();
  });

  afterAll(() => {
    z.setErrorMap(defaultMap);
  });

  test("invalid_type undefined", () => {
    const schema = z.string();
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Required");
  });

  test("invalid_type wrong type", () => {
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

  test("too_small string", () => {
    const schema = z.string().min(3);
    const result = schema.safeParse("hi");
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Must be at least 3 characters");
  });

  test("too_big string", () => {
    const schema = z.string().max(2);
    const result = schema.safeParse("toolong");
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Must be at most 2 characters");
  });

  test("too_small array", () => {
    const schema = z.array(z.string()).min(2);
    const result = schema.safeParse(["a"]);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Must have at least 2 items");
  });

  test("too_big array", () => {
    const schema = z.array(z.string()).max(2);
    const result = schema.safeParse(["a", "b", "c"]);
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Must have at most 2 items");
  });

  test("default branch", () => {
    const schema = z.string().refine(() => false, { message: "Custom error" });
    const result = schema.safeParse("hello");
    expect(result.success).toBe(false);
    expect(result.error.issues[0].message).toBe("Custom error");
  });
});

