import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import PinInput from "../../common/PinInput";

jest.mock("../../common/PinEntryModal", () => ({
  __esModule: true,
  default: function MockPinEntryModal({
    onSubmit,
  }: {
    onSubmit: (pin: string) => void;
    hideCancel?: boolean;
  }) {
    const [pin, setPin] = useState("");
    return (
      <div>
        <PinInput onChange={setPin} />
        <button onClick={() => onSubmit(pin)}>Confirm</button>
      </div>
    );
  },
}));

jest.mock("../CreditCardReceiptCheck", () => ({
  CreditCardReceiptCheck: () => null,
}));

jest.mock("../../../hooks/mutations/useCCReceiptConfirmations", () => ({
  useCCReceiptConfirmations: () => ({ confirmReceipt: jest.fn() }),
}));

let blindClose = false;
const getUserByPinMock = jest.fn((pin: string) => {
  if (pin === "111111") return { user_name: "alice", email: "a@test" };
  if (pin === "222222") return { user_name: "bob", email: "b@test" };
  return null;
});

jest.mock("../../../utils/getUserByPin", () => ({
  getUserByPin: (pin: string) => getUserByPinMock(pin),
}));

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "alice", email: "a@test" } }),
}));

jest.mock("../../../constants/settings", () => ({
  settings: {
    blindOpen: false,
    get blindClose() {
      return blindClose;
    },
    cashDrawerLimit: 1000,
    pinRequiredAboveLimit: false,
    tillMaxLimit: 2000,
  },
}));

import { CloseShiftForm } from "../CloseShiftForm";
import { DISCREPANCY_LIMIT } from "../../../constants/cash";

beforeEach(() => {
  localStorage.clear();
  blindClose = false;
  getUserByPinMock.mockClear();
});

describe("CloseShiftForm", () => {
  it("handles discrepancy with user pin", async () => {
    const onConfirm = jest.fn();

    render(
      <CloseShiftForm
        ccTransactionsFromThisShift={[{ txnId: "t1", amount: 1 }]}
        expectedCashAtClose={0}
        expectedKeycardsAtClose={0}
        variant="close"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    const denomInput = screen.getByLabelText(/€10 notes/);
    const count = Math.ceil((DISCREPANCY_LIMIT + 1) / 10);
    await userEvent.type(denomInput, String(count));
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    await userEvent.click(screen.getByRole("button", { name: /go/i }));

    // first click triggers a recount prompt when a discrepancy is detected
    await screen.findByText(/please recount/i);

    await userEvent.click(screen.getByRole("button", { name: /go/i }));

    const digits = await screen.findAllByLabelText(/PIN digit/);
    for (const d of digits) {
      await userEvent.type(d, "1");
    }
    await userEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

    expect(onConfirm).toHaveBeenCalledWith(10, 0, false, { "10": count });
    expect(getUserByPinMock).toHaveBeenCalledWith("111111");
  });

  it("reconciles a shift without manager or witness", async () => {
    const onConfirm = jest.fn();
    render(
      <CloseShiftForm
        ccTransactionsFromThisShift={[]}
        expectedCashAtClose={100}
        expectedKeycardsAtClose={0}
        variant="reconcile"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );
    const denomInput = screen.getByLabelText(/€50 notes/);
    await userEvent.type(denomInput, "3");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /go/i }));
    await screen.findByText(/please recount/i);
    await userEvent.click(screen.getByRole("button", { name: /go/i }));
    expect(onConfirm).toHaveBeenCalledWith(150, 0, true, { "50": 3 });
  });

  it("reveals expected cash when blind close is enabled", async () => {
    blindClose = true;
    render(
      <CloseShiftForm
        ccTransactionsFromThisShift={[]}
        expectedCashAtClose={100}
        expectedKeycardsAtClose={0}
        variant="reconcile"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.queryByText(/Expected cash:/)).not.toBeInTheDocument();
    const input = screen.getByLabelText(/€50 notes/);
    await userEvent.type(input, "1");
    expect(screen.getByText(/Expected cash: €100.00/)).toBeInTheDocument();
    expect(screen.getByText(/-50/)).toBeInTheDocument();
  });

  it("auto saves progress on change", async () => {
    const { unmount } = render(
      <CloseShiftForm
        ccTransactionsFromThisShift={[]}
        expectedCashAtClose={0}
        expectedKeycardsAtClose={0}
        variant="close"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await userEvent.type(screen.getByLabelText(/€10 notes/), "1");

    await waitFor(() => {
      const saved = JSON.parse(
        localStorage.getItem("close-shift-progress") || "{}"
      );
      expect(saved.cash).toBe(10);
    });

    unmount();

    render(
      <CloseShiftForm
        ccTransactionsFromThisShift={[]}
        expectedCashAtClose={0}
        expectedKeycardsAtClose={0}
        variant="close"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    await waitFor(() =>
      expect(localStorage.getItem("close-shift-progress")).not.toBeNull()
    );
  });

  it("applies dark mode styles", async () => {
    document.documentElement.classList.add("dark");
    render(
      <CloseShiftForm
        ccTransactionsFromThisShift={[]}
        expectedCashAtClose={0}
        expectedKeycardsAtClose={0}
        variant="close"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    const heading = screen.getByRole("heading", { name: /close shift - cash/i });
    const container = heading.closest("div.relative") as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
    document.documentElement.classList.remove("dark");
  });
});

