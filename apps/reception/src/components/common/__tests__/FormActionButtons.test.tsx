import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { FormActionButtons } from "../FormActionButtons";

describe("FormActionButtons", () => {
  it("fires callbacks when buttons clicked", async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    render(<FormActionButtons onCancel={onCancel} onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalled();
  });

  it("uses custom confirm text", () => {
    render(
      <FormActionButtons
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        confirmText="Go"
      />
    );
    expect(screen.getByRole("button", { name: /go/i })).toBeInTheDocument();
  });
});
