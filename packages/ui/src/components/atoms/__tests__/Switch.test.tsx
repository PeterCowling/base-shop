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
    render(<Switch checked />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });
});
