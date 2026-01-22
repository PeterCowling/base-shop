import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PayModal from "../PayModal";

describe("PayModal", () => {
  it("submits selected payment and bleep options", async () => {
    const onConfirm = jest.fn();
    render(<PayModal onConfirm={onConfirm} onCancel={jest.fn()} />);

    await userEvent.click(screen.getByRole("radio", { name: /cash/i }));
    await userEvent.click(screen.getByRole("radio", { name: /go/i }));
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onConfirm).toHaveBeenCalledWith("cash", "go");
  });

  it("calls onCancel when cancel clicked", async () => {
    const onCancel = jest.fn();
    render(<PayModal onConfirm={jest.fn()} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalled();
  });
});
