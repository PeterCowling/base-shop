// resetNextMocks not needed for this visual test; context is mocked below
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MiniCart } from "../MiniCart.client";
// Provide a test Cart context provider shim that returns an empty cart and no-op dispatch.
jest.mock("@acme/platform-core/contexts/CartContext", () => ({
  useCart: () => [{}, jest.fn()],
}));

describe("MiniCart visuals", () => {
  it("uses panel surface for the drawer content", async () => {
    render(<MiniCart trigger={<button>Open cart</button>} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /open cart/i }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.className).toMatch(/bg-panel/);
    expect(dialog.className).toMatch(/border-border-2/);
  });
});
