import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SizeSelector from "../src/components/pdp/SizeSelector";

describe("SizeSelector", () => {
  it("calls onSelect with chosen size", async () => {
    const onSelect = jest.fn();
    render(<SizeSelector sizes={["S", "M"]} onSelect={onSelect} />);
    const buttons = await screen.findAllByRole("button");
    await userEvent.click(buttons[1]);
    expect(onSelect).toHaveBeenCalledWith("M");
  });
});
