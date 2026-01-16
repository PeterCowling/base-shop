import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { FormActionButtons } from "../FormActionButtons";

describe("FormActionButtons", () => {
  it("fires callbacks when buttons clicked", async () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    render(<FormActionButtons onCancel={onCancel} onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalled();
  });

  it("uses custom confirm text", () => {
    render(
      <FormActionButtons
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        confirmText="Go"
      />
    );
    expect(screen.getByRole("button", { name: /go/i })).toBeInTheDocument();
  });
});
