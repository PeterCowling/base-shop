
import "@testing-library/jest-dom";
import { formatCreditCardNumber, splitExpiry } from "../creditCardUtils";

describe("formatCreditCardNumber", () => {
  it("formats plain digits", () => {
    expect(formatCreditCardNumber("4242424242424242")).toBe(
      "4242 4242 4242 4242"
    );
  });

  it("formats digits with spaces", () => {
    expect(formatCreditCardNumber("4242 4242 4242 4242")).toBe(
      "4242 4242 4242 4242"
    );
  });

  it("formats digits with hyphens", () => {
    expect(formatCreditCardNumber("4242-4242-4242-4242")).toBe(
      "4242 4242 4242 4242"
    );
  });
});

describe("splitExpiry", () => {
  it("splits MM/YY string", () => {
    expect(splitExpiry("10/25")).toEqual({ mm: "10", yy: "25" });
  });

  it("splits plain MMYY digits", () => {
    expect(splitExpiry("1025")).toEqual({ mm: "10", yy: "25" });
  });
});
