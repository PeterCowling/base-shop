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
    expect(screen.queryByText("Info")).toBeNull();
    await userEvent.hover(trigger);
    expect(screen.getByText("Info")).toBeInTheDocument();
    await userEvent.unhover(trigger);
  });
});
