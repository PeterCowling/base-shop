import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WishlistDrawer } from "../WishlistDrawer";
import type { SKU } from "@acme/types";

describe("WishlistDrawer", () => {
  it("shows empty state", async () => {
    render(<WishlistDrawer trigger={<button>Open</button>} items={[]} />);

    expect(
      screen.queryByRole("heading", { name: /wishlist/i })
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("Open"));
    expect(
      await screen.findByRole("heading", { name: /wishlist/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/your wishlist is empty/i)).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /wishlist/i })
      ).not.toBeInTheDocument(),
    );
  });

  it("lists items", async () => {
    const items: SKU[] = [
      { id: "1", title: "Item 1" },
      { id: "2", title: "Item 2" },
    ];
    render(<WishlistDrawer trigger={<button>Open</button>} items={items} />);

    await userEvent.click(screen.getByText("Open"));
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });
});
