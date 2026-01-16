import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SafeOpenForm } from "../SafeOpenForm";

describe("SafeOpenForm", () => {
  it("submits opening count", async () => {
    const onConfirm = vi.fn();
    render(<SafeOpenForm onConfirm={onConfirm} onCancel={vi.fn()} />);

    await userEvent.type(screen.getByPlaceholderText(/opening count/i), "100");
    await userEvent.type(screen.getByPlaceholderText(/opening keycards/i), "5");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onConfirm).toHaveBeenCalledWith(100, 5);
  });

  it("applies dark mode styles", () => {
    render(
      <div className="dark">
        <SafeOpenForm onConfirm={vi.fn()} onCancel={vi.fn()} />
      </div>
    );
    const heading = screen.getByRole("heading", { name: /open safe/i });
    const container = heading.parentElement as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
    expect(screen.getByRole("button", { name: /confirm/i })).toHaveClass(
      "dark:bg-darkAccentGreen"
    );
  });
});
