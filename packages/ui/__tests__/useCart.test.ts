import { renderHook } from "@testing-library/react";

import { useCart } from "../src/hooks/useCart";

jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: jest.fn(),
}));

const { useCart: mockUseCart } = require("@acme/platform-core/contexts/CartContext");

describe("useCart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns cart context value", () => {
    const value = { items: [{ id: "1" }], total: 10 };
    (mockUseCart as jest.Mock).mockReturnValue(value);

    const { result } = renderHook(() => useCart());

    expect(result.current).toEqual(value);
    expect(mockUseCart).toHaveBeenCalled();
  });
});
