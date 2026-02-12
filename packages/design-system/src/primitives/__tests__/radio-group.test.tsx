import "../../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";

import { RadioGroup, RadioGroupItem } from "../radio-group";

function renderRadioGroup({ disabled = false } = {}) {
  return render(
    <RadioGroup defaultValue="option1" aria-label="Options">
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option1" id="r1" />
        <label htmlFor="r1">Option 1</label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option2" id="r2" />
        <label htmlFor="r2">Option 2</label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem value="option3" id="r3" disabled={disabled} />
        <label htmlFor="r3">Option 3</label>
      </div>
    </RadioGroup>,
  );
}

describe("RadioGroup", () => {
  // TC-01: Correct ARIA roles
  it("has correct ARIA roles", async () => {
    renderRadioGroup();
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  // TC-02: Arrow keys cycle items
  it("navigates with arrow keys", async () => {
    const user = userEvent.setup();
    renderRadioGroup();

    const radios = screen.getAllByRole("radio");
    await user.click(radios[0]);
    expect(radios[0]).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(radios[1]).toHaveFocus();
  });

  // TC-03: Selecting fires onValueChange
  it("selects item on click", async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();

    render(
      <RadioGroup onValueChange={onValueChange} aria-label="Options">
        <RadioGroupItem value="a" id="ra" />
        <label htmlFor="ra">A</label>
        <RadioGroupItem value="b" id="rb" />
        <label htmlFor="rb">B</label>
      </RadioGroup>,
    );

    await user.click(screen.getByRole("radio", { name: "B" }));
    expect(onValueChange).toHaveBeenCalledWith("b");
  });

  // TC-04: Disabled items not selectable
  it("disables items correctly", () => {
    renderRadioGroup({ disabled: true });
    const disabledRadio = screen.getAllByRole("radio")[2];
    expect(disabledRadio).toBeDisabled();
  });

  // TC-05: Custom className merges
  it("merges custom className", () => {
    const { container } = render(
      <RadioGroup className="gap-4" aria-label="Test">
        <RadioGroupItem value="a" />
      </RadioGroup>,
    );
    expect(container.firstChild).toHaveClass("gap-4");
    expect(container.firstChild).toHaveClass("grid");
  });
});
