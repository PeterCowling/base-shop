import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("../../../hooks/mutations/useCCReceiptConfirmations", () => ({
  useCCReceiptConfirmations: () => ({ confirmReceipt: jest.fn() }),
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "alice", email: "a@test" } }),
}));

jest.mock("../../../constants/settings", () => ({
  settings: {
    blindOpen: true,
    blindClose: false,
    cashDrawerLimit: 1000,
    pinRequiredAboveLimit: false,
    tillMaxLimit: 2000,
  },
}));

import { OpenShiftForm } from "../OpenShiftForm";

beforeEach(() => {
  localStorage.clear();
});

describe("OpenShiftForm", () => {
  it("handles blind open", async () => {
    const onConfirm = jest.fn();
    const sampleTxn = [{ txnId: "tx1", amount: 10 }];

    render(
      <OpenShiftForm
        ccTransactionsFromLastShift={sampleTxn}
        previousFinalCash={100}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    await userEvent.type(screen.getByLabelText(/€50 notes/), "1");

    expect(screen.queryByText(/Previous count was/)).toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: /confirm shift opening/i })
    );

    expect(screen.getByText(/Previous count was €100.00/)).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    await userEvent.click(
      screen.getByRole("button", { name: /confirm shift opening/i })
    );

    expect(onConfirm).toHaveBeenCalledWith(50, false, 0, { "50": 1 });
  });

  it("saves progress to localStorage", async () => {
    const { unmount } = render(
      <OpenShiftForm
        ccTransactionsFromLastShift={[]}
        previousFinalCash={0}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await userEvent.type(screen.getByLabelText(/€1 coins/), "3");

    await waitFor(() => {
      const saved = JSON.parse(
        localStorage.getItem("open-shift-progress") || "{}"
      );
      expect(saved.cash).toBe(3);
    });

    unmount();

    render(
      <OpenShiftForm
        ccTransactionsFromLastShift={[]}
        previousFinalCash={0}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() =>
      expect(localStorage.getItem("open-shift-progress")).not.toBeNull()
    );
  });

  it("applies dark mode styles", async () => {
    document.documentElement.classList.add("dark");
    render(
      <OpenShiftForm
        ccTransactionsFromLastShift={[]}
        previousFinalCash={0}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: /confirm shift opening/i })
    );

    const info = screen.getByText(/previous count was/i).parentElement as HTMLElement;
    expect(info).toHaveClass("dark:text-darkAccentGreen");
    document.documentElement.classList.remove("dark");
  });
});

