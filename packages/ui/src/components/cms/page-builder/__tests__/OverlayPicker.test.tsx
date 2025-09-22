import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OverlayPicker from "../OverlayPicker";

describe("OverlayPicker", () => {
  it("emits CSS for presets and None", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<OverlayPicker onChange={onChange} />);

    onChange.mockClear();
    await user.click(screen.getByText("Dark veil"));
    expect(onChange).toHaveBeenLastCalledWith("rgba(0, 0, 0, 0.35)");

    await user.click(screen.getByText("Diagonal gradient"));
    expect(onChange.mock.calls.at(-1)?.[0]).toContain("linear-gradient(");

    await user.click(screen.getByText("Primary tint"));
    expect(onChange).toHaveBeenLastCalledWith("hsl(var(--color-primary) / 0.35)");

    await user.click(screen.getByText("Accent tint"));
    expect(onChange).toHaveBeenLastCalledWith("hsl(var(--color-accent) / 0.30)");

    await user.click(screen.getByText("None"));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });
});

