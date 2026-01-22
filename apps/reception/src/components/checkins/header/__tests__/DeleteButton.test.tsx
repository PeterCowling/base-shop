import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DeleteButton from "../DeleteButton";


describe("DeleteButton", () => {
  it("disables the button when disabled prop true", async () => {
    const onClick = jest.fn();
    render(<DeleteButton onClick={onClick} disabled />);
    const btn = screen.getByRole("button", { name: /delete/i });
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("calls onClick when enabled", async () => {
    const onClick = jest.fn();
    render(<DeleteButton onClick={onClick} />);
    const btn = screen.getByRole("button", { name: /delete/i });
    expect(btn).toBeEnabled();
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
