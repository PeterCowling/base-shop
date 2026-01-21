import { z } from "zod";

import { applyFriendlyZodMessages } from "../zodErrorMap";

describe("friendly error map integration", () => {
  const original = z.getErrorMap();
  beforeAll(() => {
    applyFriendlyZodMessages();
  });
  afterAll(() => {
    z.setErrorMap(original);
  });

  it("produces human friendly messages", () => {
    expect(z.string().safeParse(undefined).error?.issues[0].message).toBe(
      "Required"
    );
    expect(z.enum(["a", "b"]).safeParse("c").error?.issues[0].message).toBe(
      "Invalid value"
    );
    expect(z.string().min(3).safeParse("hi").error?.issues[0].message).toBe(
      "Must be at least 3 characters"
    );
    expect(
      z.array(z.string()).max(1).safeParse(["a", "b"]).error?.issues[0]
        .message
    ).toBe("Must have at most 1 items");
  });
});
