import { renderHook } from "@testing-library/react";

import { useCart as platformUseCart } from "@acme/platform-core/contexts/CartContext";

import { useCart } from "../useCart";

jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: jest.fn(),
}));

describe("useCart", () => { // i18n-exempt: test description
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns cart context value", () => { // i18n-exempt: test description
    const value = { items: [{ id: "1" }], total: 10 }; // i18n-exempt: test data
    (platformUseCart as unknown as jest.Mock).mockReturnValue(value);

    const { result } = renderHook(() => useCart());

    expect(result.current).toEqual(value);
    expect(platformUseCart).toHaveBeenCalled();
  });
});
