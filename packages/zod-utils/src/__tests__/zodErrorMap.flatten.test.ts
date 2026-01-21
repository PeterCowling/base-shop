import { z } from "zod";

import { applyFriendlyZodMessages } from "../zodErrorMap";

describe("friendly error map flattening", () => {
  const original = z.getErrorMap();
  beforeAll(() => applyFriendlyZodMessages());
  afterAll(() => {
    z.setErrorMap(original);
  });

  it("maps nested object and array issues", () => {
    const schema = z.object({
      user: z.object({
        name: z.string().min(3),
        email: z.string().email(),
        roles: z.array(z.enum(["admin", "user"])),
      }),
    });

    try {
      schema.parse({ user: { name: "Al", email: "nope", roles: ["guest"] } });
      fail("should throw");
    } catch (err: any) {
      const flat = err.flatten();
      expect(flat.fieldErrors.user).toEqual([
        "Must be at least 3 characters",
        "Invalid email",
        "Invalid value",
      ]);
    }
  });
});

