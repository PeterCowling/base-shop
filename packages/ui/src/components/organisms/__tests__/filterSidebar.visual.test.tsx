// resetNextMocks not needed here; global setup handles jest-dom
import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FilterSidebar } from "../FilterSidebar.client";

describe("FilterSidebar visuals", () => {
  it("uses panel surface for the drawer content", async () => {
    const onChange = jest.fn();
    render(<FilterSidebar onChange={onChange} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /filters/i }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.className).toMatch(/bg-panel/);
    expect(dialog.className).toMatch(/border-border-2/);
  });
});
