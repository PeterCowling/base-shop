import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SafeResetForm } from "../SafeResetForm";

describe("SafeResetForm", () => {
  it("submits counts", async () => {
    const onConfirm = vi.fn();
    render(
      <SafeResetForm
        currentKeycards={2}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    const input = screen.getByLabelText(/€50 notes/i);
    await userEvent.type(input, "2");
    const cardInput = screen.getByLabelText(/keycards counted/i);
    await userEvent.type(cardInput, "3");
    await userEvent.click(screen.getByRole("button", { name: /go/i }));

    expect(onConfirm).toHaveBeenCalledWith(100, 3, 1, { "50": 2 });
  });

  it("applies dark mode styles", () => {
    render(
      <div className="dark">
        <SafeResetForm
          currentKeycards={0}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      </div>
    );
    const heading = screen.getByRole("heading", { name: /reset safe/i });
    const container = heading.parentElement as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
    expect(screen.getByRole("button", { name: /go/i })).toHaveClass(
      "dark:bg-darkAccentGreen"
    );
  });
});
