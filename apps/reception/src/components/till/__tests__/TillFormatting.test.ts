
import "@testing-library/jest-dom";
import { formatItemCategory, summariseDescription } from "../helpers";

describe("formatItemCategory", () => {
  it("maps known categories", () => {
    expect(formatItemCategory("KeycardDeposit")).toBe("Keycard\nDeposit");
    expect(formatItemCategory("KeycardDepositRefund")).toBe(
      "Keycard\nDeposit\nRefund"
    );
    expect(formatItemCategory("cityTax")).toBe("City\nTax");
  });

  it("inserts spaces for camel case", () => {
    expect(formatItemCategory("exampleCategoryTest")).toBe(
      "Example\nCategory\nTest"
    );
  });
});

describe("summariseDescription", () => {
  it("handles special cases", () => {
    expect(summariseDescription("Eggs with three sides")).toBeNull();
    expect(summariseDescription("Sunny Side Up")).toBe("SSU");
    expect(summariseDescription("fresh multi-v drink")).toBe("Multi-V");
    expect(summariseDescription("large orange juice carton")).toBe("OJ Carton");
  });

  it("returns original text otherwise", () => {
    const text = "Some other item";
    expect(summariseDescription(text)).toBe(text);
  });
});
