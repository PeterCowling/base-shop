import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import PinEntryModal from "../PinEntryModal";

describe("PinEntryModal", () => {
  it("renders title and instructions", () => {
    render(
      <PinEntryModal
        title="Test PIN"
        instructions="Enter your PIN"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText("Test PIN")).toBeInTheDocument();
    expect(screen.getByText("Enter your PIN")).toBeInTheDocument();
  });

  it("calls onSubmit with typed PIN", async () => {
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(
      <PinEntryModal title="PIN" onSubmit={onSubmit} onCancel={vi.fn()} />
    );
    const input = screen.getByPlaceholderText("PIN");
    await userEvent.type(input, "123456");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onSubmit).toHaveBeenCalledWith("123456");
  });

  it("shows an error when onSubmit returns false", async () => {
    const onSubmit = vi.fn().mockResolvedValue(false);
    render(
      <PinEntryModal title="PIN" onSubmit={onSubmit} onCancel={vi.fn()} />
    );
    const input = screen.getByPlaceholderText("PIN");
    await userEvent.type(input, "000000");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(await screen.findByText("Invalid PIN")).toBeInTheDocument();
  });
});
