import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DISCREPANCY_LIMIT } from "../../../constants/cash";
import { CloseShiftForm } from "../CloseShiftForm";

const mockUseVarianceThresholds = jest.fn();

jest.mock("../../common/PasswordReauthModal", () => ({
  __esModule: true,
  default: function MockPasswordReauthModal({
    onSuccess,
  }: {
    onSuccess: () => void;
    onCancel: () => void;
  }) {
    return <button onClick={onSuccess}>Confirm</button>;
  },
}));

jest.mock("../VarianceSignoffModal", () => ({
  __esModule: true,
  default: function MockVarianceSignoffModal({
    onConfirm,
  }: {
    onConfirm: (signoff: {
      signedOffBy: string;
      signedOffByUid?: string;
      signedOffAt: string;
      varianceNote: string;
    }) => void;
    onCancel: () => void;
  }) {
    return (
      <button
        onClick={() =>
          onConfirm({
            signedOffBy: "manager",
            signedOffByUid: "uid-1",
            signedOffAt: "2024-01-01T10:00:00Z",
            varianceNote: "ok",
          })
        }
      >
        Manager Signoff
      </button>
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

jest.mock("../../../hooks/data/useVarianceThresholds", () => ({
  useVarianceThresholds: () => mockUseVarianceThresholds(),
}));

beforeEach(() => {
  localStorage.clear();
  blindClose = false;
  mockUseVarianceThresholds.mockReturnValue({
    thresholds: { cash: 1000, keycards: undefined },
    loading: false,
    error: null,
  });
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

    await userEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

    expect(onConfirm).toHaveBeenCalledWith(
      10,
      0,
      false,
      { "10": count },
      undefined,
      false
    );
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
    expect(onConfirm).toHaveBeenCalledWith(
      150,
      0,
      true,
      { "50": 3 },
      undefined,
      false
    );
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

  it("requires manager sign-off when variance exceeds threshold", async () => {
    mockUseVarianceThresholds.mockReturnValue({
      thresholds: { cash: 0, keycards: undefined },
      loading: false,
      error: null,
    });
    const onConfirm = jest.fn();

    render(
      <CloseShiftForm
        ccTransactionsFromThisShift={[]}
        expectedCashAtClose={0}
        expectedKeycardsAtClose={0}
        variant="close"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    await userEvent.type(screen.getByLabelText(/€10 notes/), "1");
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /next/i }));
    await userEvent.click(screen.getByRole("button", { name: /go/i }));

    await userEvent.click(screen.getByRole("button", { name: /manager signoff/i }));
    await userEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

    expect(onConfirm).toHaveBeenCalledWith(
      10,
      0,
      true,
      { "10": 1 },
      {
        signedOffBy: "manager",
        signedOffByUid: "uid-1",
        signedOffAt: "2024-01-01T10:00:00Z",
        varianceNote: "ok",
      },
      true
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
