import { configure,render } from "@testing-library/react";

import { useCart } from "../CartContext";

import { clearCartStorage } from "./cartTestUtils";

configure({ testIdAttribute: "data-testid" });

describe("useCart", () => {
  beforeEach(() => clearCartStorage());

  it("throws when used outside CartProvider", () => {
    function Test() {
      useCart();
      return null;
    }
    expect(() => render(<Test />)).toThrow("useCart must be inside CartProvider");
  });
});
