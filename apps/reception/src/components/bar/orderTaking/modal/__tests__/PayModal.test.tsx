import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import PayModal from "../PayModal";

describe("PayModal", () => {
  it("submits selected payment and bleep options", async () => {
    const onConfirm = vi.fn();
    render(<PayModal onConfirm={onConfirm} onCancel={vi.fn()} />);

    await userEvent.click(screen.getByRole("radio", { name: /cash/i }));
    await userEvent.click(screen.getByRole("radio", { name: /go/i }));
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onConfirm).toHaveBeenCalledWith("cash", "go");
  });

  it("calls onCancel when cancel clicked", async () => {
    const onCancel = vi.fn();
    render(<PayModal onConfirm={vi.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });
});
