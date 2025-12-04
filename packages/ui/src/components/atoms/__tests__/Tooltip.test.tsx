import "../../../../../../test/resetNextMocks";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "../Tooltip";

describe("Tooltip", () => {
  it("reveals tooltip on hover and focus and wires aria-describedby", async () => {
    const user = userEvent.setup();
    const { getByRole } = render(
      <Tooltip text="Sample text">
        <button>Hover me</button>
      </Tooltip>,
    );

    const button = getByRole("button", { name: "Hover me" });
    const tooltip = getByRole("tooltip", { hidden: true });
    expect(tooltip).toHaveAttribute("aria-hidden", "true");

    await user.hover(button);
    expect(tooltip).toHaveAttribute("data-state", "open");
    expect(button.getAttribute("aria-describedby")).toContain(tooltip.id);

    await user.unhover(button);
    expect(tooltip).toHaveAttribute("data-state", "closed");

    await user.tab(); // focus
    expect(tooltip).toHaveAttribute("data-state", "open");
  });
});
