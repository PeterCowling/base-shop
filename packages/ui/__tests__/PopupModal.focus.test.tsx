import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PopupModal from "../src/components/cms/blocks/PopupModal";

describe("PopupModal focus management", () => {
  it("traps focus within the modal", async () => {
    render(
      <PopupModal content="<button>First</button><button>Second</button>" />
    );
    const user = userEvent.setup();
    const buttons = await screen.findAllByRole("button");

    buttons[0].focus();
    expect(buttons[0]).toHaveFocus();
    await user.tab();
    expect(buttons[1]).toHaveFocus();
    await user.tab();
    expect(buttons[2]).toHaveFocus();
    await user.tab();
    expect(buttons[0]).toHaveFocus();

    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(buttons[2]).toHaveFocus();
  });
});
