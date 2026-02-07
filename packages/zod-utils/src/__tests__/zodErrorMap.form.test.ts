import { z } from "zod";

import { applyFriendlyZodMessages } from "../zodErrorMap";

describe("friendly error map for user form", () => {
  const original = z.getErrorMap();
  beforeAll(() => applyFriendlyZodMessages());
  afterAll(() => {
    z.setErrorMap(original);
  });

  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
  });

  it("returns human friendly messages and format for multiple issues", () => {
    const result = schema.safeParse({ email: "not-an-email", password: "123" });
    expect(result.success).toBe(false);
    if (result.success) {
      throw new Error("Expected validation to fail");
    }
    const messages = result.error.issues.map((i) => i.message);
    expect(messages).toEqual([
      "Invalid email",
      "Must be at least 8 characters",
    ]);
    expect(result.error.format()).toEqual({
      email: { _errors: ["Invalid email"] },
      password: { _errors: ["Must be at least 8 characters"] },
      _errors: [],
    });
  });
});
