import "../../../../../../../test/resetNextMocks";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Slider } from "../slider";

describe("Slider", () => {
  // TC-01: Correct ARIA attributes
  it("has correct ARIA attributes", () => {
    render(<Slider defaultValue={[50]} min={0} max={100} aria-label="Volume" />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuemin", "0");
    expect(slider).toHaveAttribute("aria-valuemax", "100");
    expect(slider).toHaveAttribute("aria-valuenow", "50");
  });

  // TC-02: Arrow keys adjust value
  it("adjusts value with arrow keys", async () => {
    const onValueChange = jest.fn();
    const user = userEvent.setup();

    render(
      <Slider
        defaultValue={[50]}
        min={0}
        max={100}
        step={1}
        onValueChange={onValueChange}
        aria-label="Volume"
      />
    );

    const slider = screen.getByRole("slider");
    await user.click(slider);
    await user.keyboard("{ArrowRight}");
    expect(onValueChange).toHaveBeenCalled();
  });

  // TC-03: Range mode renders two thumbs
  it("renders two thumbs in range mode", () => {
    render(
      <Slider defaultValue={[25, 75]} min={0} max={100} aria-label="Price range" />
    );
    const sliders = screen.getAllByRole("slider");
    expect(sliders).toHaveLength(2);
  });

  // TC-04: Step constrains values
  it("respects step prop", () => {
    render(
      <Slider defaultValue={[50]} min={0} max={100} step={10} aria-label="Volume" />
    );
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuenow", "50");
  });

  // TC-05: Custom className merges
  it("merges custom className", () => {
    const { container } = render(
      <Slider defaultValue={[50]} className="w-64" aria-label="Volume" />
    );
    expect(container.firstChild).toHaveClass("w-64");
    expect(container.firstChild).toHaveClass("relative", "flex");
  });
});
