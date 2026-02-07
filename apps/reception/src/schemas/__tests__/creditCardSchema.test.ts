
import "@testing-library/jest-dom";

import { creditCardSchema } from "../creditCardSchema";

describe("creditCardSchema", () => {
  it("accepts valid card data", () => {
    expect(() =>
      creditCardSchema.parse({
        cardNumber: "4111 1111 1111 1111",
        expiry: "12/30",
      })
    ).not.toThrow();

    expect(() =>
      creditCardSchema.parse({
        cardNumber: "4242424242424",
        expiry: "01/25",
      })
    ).not.toThrow();
  });

  it("rejects invalid card numbers", () => {
    expect(() =>
      creditCardSchema.parse({ cardNumber: "123", expiry: "10/25" })
    ).toThrow();
    expect(() =>
      creditCardSchema.parse({
        cardNumber: "12345678901234567",
        expiry: "10/25",
      })
    ).toThrow();
    expect(() =>
      creditCardSchema.parse({
        cardNumber: "abcd1234abcd1234",
        expiry: "10/25",
      })
    ).toThrow();
  });

  it("rejects invalid expiry", () => {
    expect(() =>
      creditCardSchema.parse({ cardNumber: "4242424242424", expiry: "13/25" })
    ).toThrow();
    expect(() =>
      creditCardSchema.parse({ cardNumber: "4242424242424", expiry: "1/25" })
    ).toThrow();
    expect(() =>
      creditCardSchema.parse({ cardNumber: "4242424242424", expiry: "01/2" })
    ).toThrow();
  });
});
