import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SafeResetForm } from "../SafeResetForm";

describe("SafeResetForm", () => {
  it("submits counts", async () => {
    const onConfirm = jest.fn();
    render(
      <SafeResetForm
        currentKeycards={2}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText(/€50 notes/i);
    await userEvent.type(input, "2");
    const cardInput = screen.getByLabelText(/keycards counted/i);
    await userEvent.type(cardInput, "3");
    await userEvent.click(screen.getByRole("button", { name: /go/i }));

    expect(onConfirm).toHaveBeenCalledWith(100, 3, 1, { "50": 2 });
  });

  it("applies dark mode styles", () => {
    render(
      <div className="dark">
        <SafeResetForm
          currentKeycards={0}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      </div>
    );
    const heading = screen.getByRole("heading", { name: /reset safe/i });
    const container = heading.parentElement as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
    expect(screen.getByRole("button", { name: /go/i })).toHaveClass(
      "dark:bg-darkAccentGreen"
    );
  });
});
