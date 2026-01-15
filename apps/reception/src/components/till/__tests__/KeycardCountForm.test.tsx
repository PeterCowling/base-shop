import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../utils/toastUtils", () => ({ showToast: vi.fn() }));
import { showToast } from "../../../utils/toastUtils";
const showToastMock = showToast as unknown as ReturnType<typeof vi.fn>;

import { KeycardCountForm } from "../KeycardCountForm";

describe("KeycardCountForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirms valid counts", async () => {
    const onConfirm = vi.fn();
    render(
      <KeycardCountForm expectedCount={0} onConfirm={onConfirm} onCancel={vi.fn()} />
    );
    const input = screen.getByLabelText(/count/i);
    await userEvent.clear(input);
    await userEvent.type(input, "5");
    await userEvent.click(screen.getByRole("button", { name: /go/i }));
    expect(onConfirm).toHaveBeenCalledWith(5);
  });

  it("shows toast for invalid counts", async () => {
    const onConfirm = vi.fn();
    render(
      <KeycardCountForm expectedCount={0} onConfirm={onConfirm} onCancel={vi.fn()} />
    );
    const input = screen.getByLabelText(/count/i);
    await userEvent.clear(input);
    await userEvent.type(input, "-1");
    await userEvent.click(screen.getByRole("button", { name: /go/i }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(showToastMock).toHaveBeenCalledWith(
      "Enter a non-negative number",
      "error"
    );
  });

  it("applies dark mode styles", () => {
    document.documentElement.classList.add("dark");
    render(
      <KeycardCountForm
        expectedCount={0}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const heading = screen.getByRole("heading", { name: /count keycards/i });
    const container = heading.closest("div.relative") as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
    expect(screen.getByRole("button", { name: /go/i })).toHaveClass(
      "dark:bg-darkAccentGreen"
    );
    document.documentElement.classList.remove("dark");
  });
});
