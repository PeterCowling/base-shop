/**
 * @jest-environment node
 */

// packages/platform-core/__tests__/CurrencyContext.node.test.ts
import { readInitial } from "../src/contexts/CurrencyContext";

describe("readInitial (node)", () => {
  it("returns EUR when window is undefined", () => {
    expect(typeof window).toBe("undefined");
    expect(readInitial()).toBe("EUR");
  });
});
