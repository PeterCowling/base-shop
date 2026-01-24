import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SafeReconcileForm from "../SafeReconcileForm";

let blindCloseEnabled = false;

jest.mock("../../../constants/settings", () => ({
  settings: {
    get blindClose() {
      return blindCloseEnabled;
    },
    blindOpen: false,
    cashDrawerLimit: 1000,
    pinRequiredAboveLimit: false,
    tillMaxLimit: 2000,
  },
}));

jest.mock("../../common/PasswordReauthInline", () => ({
  __esModule: true,
  default: ({ onSubmit }: { onSubmit: () => void }) => (
    <button onClick={onSubmit}>Confirm</button>
  ),
}));

describe("SafeReconcileForm", () => {
  beforeEach(() => {
    blindCloseEnabled = false;
  });

  it("computes breakdown and calls confirm", async () => {
    const onConfirm = jest.fn();
    render(
      <SafeReconcileForm
        expectedSafe={100}
        expectedKeycards={1}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText(/€50 notes/);
    await userEvent.type(input, "2");
    const cardInput = screen.getByLabelText(/keycards counted/i);
    await userEvent.type(cardInput, "1");

    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(onConfirm).toHaveBeenCalledWith(
      100,
      0,
      1,
      0,
      { "50": 2 }
    );
  });

  it("reveals expected cash when blind close is enabled", async () => {
    blindCloseEnabled = true;
    render(
      <SafeReconcileForm
        expectedSafe={100}
        expectedKeycards={0}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.queryByText(/Expected cash:/)).not.toBeInTheDocument();

    const input = screen.getByLabelText(/€50 notes/);
    await userEvent.type(input, "2");

    expect(screen.getByText(/Expected cash: €100.00/)).toBeInTheDocument();
    // Difference badge no longer includes the currency symbol
    // Multiple difference badges are shown (cash and keycards),
    // so verify at least one matches the expected format
    expect(screen.getAllByText(/\+\s*0/).length).toBeGreaterThan(0);
  });

  it("applies dark mode styles", async () => {
    render(
      <div className="dark">
        <SafeReconcileForm
          expectedSafe={100}
          expectedKeycards={0}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      </div>
    );
    const heading = screen.getByRole("heading", { name: /reconcile safe/i });
    const container = heading.closest("div.relative") as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
  });
});
