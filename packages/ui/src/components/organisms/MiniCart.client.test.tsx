import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MiniCart } from "./MiniCart.client";

jest.mock("@platform-core/contexts/CurrencyContext", () => ({ useCurrency: () => ["EUR", jest.fn()], }));

jest.mock("@platform-core/contexts/CartContext", () => {
  const React = require("react");
  const initialCart = {
    "sku1:m": {
      sku: { id: "sku1", title: "Item 1", price: 10, sizes: [] },
      qty: 1,
      size: "m",
    },
    "sku2:l": {
      sku: { id: "sku2", title: "Item 2", price: 15, sizes: [] },
      qty: 2,
      size: "l",
    },
  };
  return {
    useCart: () => {
      const [cart, setCart] = React.useState(initialCart);
      const dispatch = jest.fn(async (action) => {
        setCart((prev) => {
          const copy: any = { ...prev };
          if (action.type === "remove") {
            delete copy[action.id];
          }
          if (action.type === "setQty") {
            const line = copy[action.id];
            if (line) {
              copy[action.id] = { ...line, qty: action.qty };
            }
          }
          return copy;
        });
      });
      return [cart, dispatch];
    },
  };
});

describe("MiniCart interactions", () => {
  it("updates quantities, removes items, and recalculates subtotal", async () => {
    render(<MiniCart trigger={<button>Cart</button>} />);

    await userEvent.click(screen.getByText("Cart"));

    expect(await screen.findByText("€40.00")).toBeInTheDocument();

    const incButtons = screen.getAllByRole("button", {
      name: /increase quantity/i,
    });
    await userEvent.click(incButtons[0]);
    expect(await screen.findByText("€50.00")).toBeInTheDocument();

    const decButtons = screen.getAllByRole("button", {
      name: /decrease quantity/i,
    });
    await userEvent.click(decButtons[0]);
    expect(await screen.findByText("€40.00")).toBeInTheDocument();

    const removeButtons = screen.getAllByRole("button", { name: /remove/i });
    await userEvent.click(removeButtons[1]);
    expect(await screen.findByText("€10.00")).toBeInTheDocument();
  });
});
