import "../../../../../../test/resetNextMocks";

import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { Tooltip } from "../Tooltip";

describe("Tooltip", () => {
  it("reveals tooltip on hover and focus and wires aria-describedby", async () => {
    const user = userEvent.setup();
    const { container,  getByRole } = render(
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

  it("supports shape/radius overrides and wraps long content", async () => {
    const user = userEvent.setup();
    const { getByRole } = render(
      <Tooltip text="Long tooltip content that should wrap instead of overflowing the viewport." shape="square">
        <button>Trigger</button>
      </Tooltip>,
    );
    const button = getByRole("button", { name: "Trigger" });
    const tooltip = getByRole("tooltip", { hidden: true });

    await user.hover(button);
    expect(tooltip.className).toContain("rounded-none");
    expect(tooltip.className).toContain("whitespace-normal");
    expect(tooltip.className).toContain("break-words");
  });
});
