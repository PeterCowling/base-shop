import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "../Switch";

describe("Switch", () => {
  it("toggles and calls onChange", async () => {
    const handleChange = jest.fn();
    render(<Switch onChange={handleChange} />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(handleChange).toHaveBeenCalled();
    expect(checkbox).toBeChecked();
  });

  it("supports controlled checked prop", () => {
    render(<Switch checked onChange={() => {}} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("applies custom className to the label", () => {
    const { container } = render(<Switch className="my-switch" />);
    const label = container.querySelector("label");
    expect(label).toHaveClass("relative");
    expect(label).toHaveClass("inline-flex");
    expect(label).toHaveClass("cursor-pointer");
    expect(label).toHaveClass("items-center");
    expect(label).toHaveClass("my-switch");
  });
});
