import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PromoCodeInput } from "./PromoCodeInput";

describe("PromoCodeInput", () => {
  it("applies a valid code", async () => {
    const onApply = jest.fn();
    render(<PromoCodeInput onApply={onApply} />);
    const input = screen.getByPlaceholderText("Promo code");
    await userEvent.type(input, "SAVE10");
    await userEvent.click(screen.getByRole("button", { name: /apply/i }));
    expect(onApply).toHaveBeenCalledWith("SAVE10");
  });

  it("ignores an empty invalid code", async () => {
    const onApply = jest.fn();
    render(<PromoCodeInput onApply={onApply} />);
    const button = screen.getByRole("button", { name: /apply/i });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onApply).not.toHaveBeenCalled();
  });
});
