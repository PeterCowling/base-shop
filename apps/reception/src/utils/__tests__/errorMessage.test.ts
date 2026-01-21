import "@testing-library/jest-dom";
import { z } from "zod";
import { getErrorMessage } from "../errorMessage";

describe("getErrorMessage", () => {
  it("handles ZodError", () => {
    let error: unknown;
    try {
      z.string().parse(123);
    } catch (e) {
      error = e;
    }
    const msg = getErrorMessage(error);
    expect(msg).toMatch(/Validation failed/i);
    expect(msg).toMatch(/Expected string/);
  });

  it("handles Error objects", () => {
    const err = new Error("boom");
    expect(getErrorMessage(err)).toBe("boom");
  });

  it("handles primitives", () => {
    expect(getErrorMessage("oops")).toBe("oops");
  });
});
