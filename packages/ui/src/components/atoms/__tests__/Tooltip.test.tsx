import "../../../../../../test/resetNextMocks";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "../Tooltip";

describe("Tooltip", () => {
  it("renders hidden tooltip text in the DOM", async () => {
    const { container } = render(
      <Tooltip text="Sample text">
        <button>Hover me</button>
      </Tooltip>,
    );

    // The tooltip element is present but hidden by default
    const wrapper = container.querySelector("span");
    const tooltip = wrapper?.querySelector("span");
    expect(tooltip).toHaveTextContent("Sample text");
    expect(tooltip).toHaveClass("hidden");

    // Hovering reveals the tooltip without altering its text
    await userEvent.hover(wrapper!.querySelector("button")!);
    expect(tooltip).toHaveTextContent("Sample text");
    await userEvent.unhover(wrapper!.querySelector("button")!);
  });
});
