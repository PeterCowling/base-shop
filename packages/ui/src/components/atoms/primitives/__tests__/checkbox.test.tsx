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
});
