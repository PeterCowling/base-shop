import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MiniCart } from "../MiniCart.client";

jest.mock("@acme/platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

const mockUseCart = jest.fn();
jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: () => mockUseCart(),
}));

describe("MiniCart client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows empty state when cart is empty", async () => {
    mockUseCart.mockReturnValue([{}, jest.fn()]);
    render(<MiniCart trigger={<button>Cart</button>} />);

    await userEvent.click(screen.getByText("Cart"));
    expect(await screen.findByText("Cart is empty.")).toBeInTheDocument();
  });

  it("renders subtotal and displays toast when dispatch errors occur", async () => {
    const dispatch = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockRejectedValueOnce("nope");
    mockUseCart.mockReturnValue([
      {
        "sku1:m": {
          sku: { id: "sku1", title: "Item", price: 10, sizes: [] },
          qty: 1,
          size: "m",
        },
      },
      dispatch,
    ]);

    render(<MiniCart trigger={<button>Cart</button>} />);
    await userEvent.click(screen.getByText("Cart"));

    expect(await screen.findByText("$10.00")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /increase quantity/i })
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: "setQty",
      id: "sku1:m",
      qty: 2,
    });
    expect(await screen.findByText("fail")).toBeInTheDocument();

    // Close the toast via its accessible label
    await userEvent.click(screen.getByRole("button", { name: /close/i }));

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(dispatch).toHaveBeenCalledWith({ type: "remove", id: "sku1:m" });
    expect(
      await screen.findByText("Failed to update cart.")
    ).toBeInTheDocument();
  });

  it("handles successful quantity updates and numeric drawer widths", async () => {
    const dispatch = jest.fn().mockResolvedValue(undefined);
    mockUseCart.mockReturnValue([
      {
        "sku2:l": {
          sku: { id: "sku2", title: "Other", price: 15, sizes: [] },
          qty: 2,
          size: "L",
        },
      },
      dispatch,
    ]);

    render(<MiniCart trigger={<button>Cart</button>} width={320} />);
    await userEvent.click(screen.getByText("Cart"));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toHaveStyle({ width: "320px" });
    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(screen.getByText("(L)")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /decrease quantity/i })
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: "setQty",
      id: "sku2:l",
      qty: 1,
    });

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(dispatch).toHaveBeenCalledWith({ type: "remove", id: "sku2:l" });
    expect(screen.queryByText("Failed to update cart.")).not.toBeInTheDocument();
  });
});
