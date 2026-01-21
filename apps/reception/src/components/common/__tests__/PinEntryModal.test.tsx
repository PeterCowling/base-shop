import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PinEntryModal from "../PinEntryModal";

describe("PinEntryModal", () => {
  it("renders title and instructions", () => {
    render(
      <PinEntryModal
        title="Test PIN"
        instructions="Enter your PIN"
        onSubmit={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText("Test PIN")).toBeInTheDocument();
    expect(screen.getByText("Enter your PIN")).toBeInTheDocument();
  });

  it("calls onSubmit with typed PIN", async () => {
    const onSubmit = jest.fn().mockResolvedValue(true);
    render(
      <PinEntryModal title="PIN" onSubmit={onSubmit} onCancel={jest.fn()} />
    );
    const input = screen.getByPlaceholderText("PIN");
    await userEvent.type(input, "123456");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(onSubmit).toHaveBeenCalledWith("123456");
  });

  it("shows an error when onSubmit returns false", async () => {
    const onSubmit = jest.fn().mockResolvedValue(false);
    render(
      <PinEntryModal title="PIN" onSubmit={onSubmit} onCancel={jest.fn()} />
    );
    const input = screen.getByPlaceholderText("PIN");
    await userEvent.type(input, "000000");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));
    expect(await screen.findByText("Invalid PIN")).toBeInTheDocument();
  });
});
