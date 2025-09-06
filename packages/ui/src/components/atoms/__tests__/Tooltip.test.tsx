import "../../../../../../test/resetNextMocks";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "../Tooltip";

describe("Tooltip", () => {
  it("reveals text on hover", async () => {
    render(
      <Tooltip text="Info">
        <button>Hover me</button>
      </Tooltip>,
    );

    const trigger = screen.getByText("Hover me");
    const tooltip = screen.getByText("Info");
    expect(tooltip).toHaveClass("hidden");
    await userEvent.hover(trigger);
    expect(tooltip).toHaveClass("group-hover:block");
    await userEvent.unhover(trigger);
  });
});
