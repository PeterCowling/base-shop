import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import StepProgress from "../StepProgress";

describe("StepProgress", () => {
  it("allows navigating back", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StepProgress step={2} onStepChange={onChange} userName="Bob" />);
    await user.click(screen.getByRole("button", { name: "1" }));
    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("prevents forward navigation for non-Pete", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StepProgress step={0} onStepChange={onChange} userName="Bob" />);
    await user.click(screen.getByRole("button", { name: "2" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("allows forward navigation for Pete", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<StepProgress step={0} onStepChange={onChange} userName="Pete" />);
    await user.click(screen.getByRole("button", { name: "2" }));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});
