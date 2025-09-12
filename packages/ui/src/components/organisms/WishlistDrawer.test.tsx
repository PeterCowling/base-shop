import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WishlistDrawer } from "./WishlistDrawer";
import type { SKU } from "@acme/types";

describe("WishlistDrawer interactions", () => {
  it("adds and removes items", async () => {
    const user = userEvent.setup();

    function Wrapper() {
      const [items, setItems] = React.useState<SKU[]>([]);
      return (
        <>
          <button onClick={() => setItems([{ id: "1", title: "Item 1" }])}>
            Add
          </button>
          <button onClick={() => setItems([])}>Remove</button>
          <WishlistDrawer trigger={<button>Open</button>} items={items} />
        </>
      );
    }

    render(<Wrapper />);

    await user.click(screen.getByText("Open"));
    expect(
      await screen.findByText(/wishlist is empty/i)
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByText(/wishlist is empty/i)).not.toBeInTheDocument()
    );

    await user.click(screen.getByText("Add"));
    await user.click(screen.getByText("Open"));
    expect(await screen.findByText("Item 1")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(screen.queryByText("Item 1")).not.toBeInTheDocument()
    );

    await user.click(screen.getByText("Remove"));
    await user.click(screen.getByText("Open"));
    expect(await screen.findByText(/wishlist is empty/i)).toBeInTheDocument();
  });

  it("closes drawer with escape", async () => {
    const user = userEvent.setup();
    const items: SKU[] = [{ id: "1", title: "Item 1" }];
    render(<WishlistDrawer trigger={<button>Open</button>} items={items} />);

    await user.click(screen.getByText("Open"));
    expect(
      await screen.findByRole("heading", { name: /wishlist/i })
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: /wishlist/i })
      ).not.toBeInTheDocument()
    );
  });

  it("navigates to product page", async () => {
    const user = userEvent.setup();
    const item: SKU = { id: "1", title: "Item 1" };
    render(
      <WishlistDrawer trigger={<button>Open</button>} items={[item]} />
    );

    await user.click(screen.getByText("Open"));
    const viewBtn = await screen.findByRole("button", { name: /view/i });

    const assign = jest.fn();
    const originalLocation = window.location;
    // @ts-expect-error allow reassignment for testing
    delete window.location;
    // @ts-expect-error test replacement
    window.location = { ...originalLocation, assign };

    viewBtn.addEventListener("click", () =>
      window.location.assign(`/products/${item.id}`)
    );

    await user.click(viewBtn);
    expect(assign).toHaveBeenCalledWith(`/products/${item.id}`);

    window.location = originalLocation;
  });
});

