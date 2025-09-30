import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MiniCart } from "../MiniCart.client";

jest.mock("@platform-core/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

const mockUseCart = jest.fn();
jest.mock("@platform-core/contexts/CartContext", () => ({
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
    const dispatch = jest.fn().mockRejectedValue(new Error("fail"));
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
    expect(await screen.findByText("fail")).toBeInTheDocument();
  });
});
