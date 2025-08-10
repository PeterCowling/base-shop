import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MiniCart } from "../MiniCart.client";

jest.mock("@platform-core/src/contexts/CurrencyContext", () => ({
  useCurrency: () => ["USD", jest.fn()],
}));

const mockUseCart = jest.fn();
jest.mock("@platform-core/src/contexts/CartContext", () => ({
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

  it("shows cart items and handles removal", async () => {
    const dispatch = jest.fn();
    mockUseCart.mockReturnValue([
      {
        sku1: {
          sku: { id: "sku1", title: "Item", price: 10 },
          qty: 1,
        },
      },
      dispatch,
    ]);

    render(<MiniCart trigger={<button>Cart</button>} />);
    await userEvent.click(screen.getByText("Cart"));

    expect(await screen.findByText("Item")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));
    expect(dispatch).toHaveBeenCalledWith({ type: "remove", id: "sku1" });
  });
});
