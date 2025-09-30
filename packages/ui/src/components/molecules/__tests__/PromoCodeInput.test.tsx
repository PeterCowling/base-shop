import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PromoCodeInput } from "../PromoCodeInput";

describe("PromoCodeInput", () => {
  it("calls onApply on submit when provided", async () => {
    const onApply = jest.fn();
    render(<PromoCodeInput onApply={onApply} />);
    const input = screen.getByPlaceholderText("Promo code");
    await userEvent.type(input, "SAVE10");
    fireEvent.click(screen.getByRole("button"));
    expect(onApply).toHaveBeenCalledWith("SAVE10");
  });

  it("does nothing on submit when onApply omitted", async () => {
    render(<PromoCodeInput />);
    const input = screen.getByPlaceholderText("Promo code");
    await userEvent.type(input, "SAVE10");
    const button = screen.getByRole("button");
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it("disables button when loading or code empty and toggles text", async () => {
    const { rerender } = render(<PromoCodeInput />);
    const input = screen.getByPlaceholderText("Promo code");
    const button = screen.getByRole("button");

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Apply");

    await userEvent.type(input, "SAVE10");
    expect(button).not.toBeDisabled();
    expect(button).toHaveTextContent("Apply");

    rerender(<PromoCodeInput loading />);
    expect(button).toBeDisabled();
    // Accept both three dots and single ellipsis
    expect(button.textContent || "").toMatch(/Applying(\.{3}|…)/);
  });
});
