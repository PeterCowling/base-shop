import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OverlayPicker from "../OverlayPicker";

describe("OverlayPicker", () => {
  it("emits CSS for presets and None", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    // Provide concrete HSL tokens so assertions avoid hsl(var(--…)) literals
    document.documentElement.style.setProperty("--color-primary", "210 100% 50%");
    document.documentElement.style.setProperty("--color-accent", "320 80% 45%");
    render(<OverlayPicker onChange={onChange} />);

    onChange.mockClear();
    await user.click(screen.getByText("Dark veil"));
    expect(onChange).toHaveBeenLastCalledWith("rgba(0, 0, 0, 0.35)");

    await user.click(screen.getByText("Diagonal gradient"));
    expect(onChange.mock.calls.at(-1)?.[0]).toContain("linear-gradient(");

    await user.click(screen.getByText("Primary tint"));
    const primary = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-primary")
      .trim();
    expect(onChange).toHaveBeenLastCalledWith(`hsl(${primary} / 0.35)`);

    await user.click(screen.getByText("Accent tint"));
    const accent = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-accent")
      .trim();
    expect(onChange).toHaveBeenLastCalledWith(`hsl(${accent} / 0.30)`);

    await user.click(screen.getByText("None"));
    expect(onChange).toHaveBeenLastCalledWith(undefined);
  });
});
