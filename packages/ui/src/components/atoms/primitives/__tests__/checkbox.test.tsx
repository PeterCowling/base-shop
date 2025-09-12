import "../../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "../checkbox";

describe("Checkbox", () => {
  it("mounts and toggles state", async () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("data-token", "--color-primary");
    expect(checkbox).toHaveAttribute("data-state", "unchecked");

    const user = userEvent.setup();
    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("data-state", "checked");
  });

  it("calls onCheckedChange when toggled", async () => {
    const onCheckedChange = jest.fn();
    render(<Checkbox onCheckedChange={onCheckedChange} />);
    const user = userEvent.setup();
    const checkbox = screen.getByRole("checkbox");

    await user.click(checkbox);
    await user.click(checkbox);

    expect(onCheckedChange).toHaveBeenNthCalledWith(1, true);
    expect(onCheckedChange).toHaveBeenNthCalledWith(2, false);
  });

  it("merges custom className", () => {
    render(<Checkbox className="custom" />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveClass("custom");
  });

  it("renders checkmark indicator only when checked", async () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox.querySelector("svg")).toBeNull();

    const user = userEvent.setup();
    await user.click(checkbox);
    expect(checkbox.querySelector("svg")).not.toBeNull();
  });
});
