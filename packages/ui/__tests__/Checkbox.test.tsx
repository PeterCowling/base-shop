import { fireEvent, render, screen } from "@testing-library/react";

import { Checkbox } from "../src/components/atoms/shadcn";

describe("Checkbox", () => {
  it("toggles state, manages focus, and applies class overrides", () => {
    render(<Checkbox className="custom-checkbox" />);
    const checkbox = screen.getByRole("checkbox");

    checkbox.focus();
    expect(checkbox).toHaveFocus();
    expect(checkbox).toHaveAttribute("aria-checked", "false");

    fireEvent.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "true");
    expect(checkbox).toHaveFocus();

    fireEvent.click(checkbox);
    expect(checkbox).toHaveAttribute("aria-checked", "false");
    expect(checkbox).toHaveClass("custom-checkbox");
  });
});
