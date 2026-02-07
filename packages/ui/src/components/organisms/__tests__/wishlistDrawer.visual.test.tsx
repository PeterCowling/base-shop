// resetNextMocks not needed for this visual test
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { WishlistDrawer } from "../WishlistDrawer";

const items = [
  { id: "1", title: "Item One", price: 1000 } as any,
  { id: "2", title: "Item Two", price: 2000 } as any,
];

describe("WishlistDrawer visuals", () => {
  it("uses panel surface for the drawer content", async () => {
    render(
      <WishlistDrawer trigger={<button>Open</button>} items={items} />
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open/i }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.className).toMatch(/bg-panel/);
    expect(dialog.className).toMatch(/border-border-2/);
  });
});
