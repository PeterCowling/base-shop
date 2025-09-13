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

  it("calls onCheckedChange and updates indicator through toggle cycle", async () => {
    const onCheckedChange = jest.fn();
    render(<Checkbox onCheckedChange={onCheckedChange} />);
    const checkbox = screen.getByRole("checkbox");
    const user = userEvent.setup();

    expect(checkbox.querySelector("svg")).toBeNull();

    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("data-state", "checked");
    expect(onCheckedChange).toHaveBeenNthCalledWith(1, true);
    expect(checkbox.querySelector("svg")).not.toBeNull();

    await user.click(checkbox);
    expect(checkbox).toHaveAttribute("data-state", "unchecked");
    expect(onCheckedChange).toHaveBeenNthCalledWith(2, false);
    expect(checkbox.querySelector("svg")).toBeNull();
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
