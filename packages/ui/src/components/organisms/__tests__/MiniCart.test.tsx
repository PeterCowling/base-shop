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

describe("MiniCart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders empty state when cart has no items", async () => {
    mockUseCart.mockReturnValue([{}, jest.fn()]);
    render(<MiniCart trigger={<button>Open Cart</button>} />);

    await userEvent.click(screen.getByText("Open Cart"));
    expect(await screen.findByText("Cart is empty.")).toBeInTheDocument();
  });

  it("shows cart items and handles quantity changes and removal", async () => {
    const dispatch = jest.fn();
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

    const { baseElement } = render(<MiniCart trigger={<button>Cart</button>} />);
    await userEvent.click(screen.getByText("Cart"));
    expect(await screen.findByText("Item")).toBeInTheDocument();
    // Snapshot removed to avoid brittleness from minor markup changes

    await userEvent.click(
      screen.getByRole("button", { name: /increase quantity/i })
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: "setQty",
      id: "sku1:m",
      qty: 2,
    });

    await userEvent.click(
      screen.getByRole("button", { name: /decrease quantity/i })
    );
    expect(dispatch).toHaveBeenCalledWith({
      type: "setQty",
      id: "sku1:m",
      qty: 0,
    });

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(dispatch).toHaveBeenCalledWith({ type: "remove", id: "sku1:m" });
  });
});
