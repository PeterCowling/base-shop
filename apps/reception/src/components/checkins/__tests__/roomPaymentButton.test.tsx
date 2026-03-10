import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  PaymentContext,
  usePaymentContext,
} from "../../../components/checkins/roomButton/PaymentContext";
import type { CheckInRow } from "../../../types/component/CheckinRow";
import RoomPaymentButton from "../roomButton/roomPaymentButton";

jest.mock("react-dom", async () => {
  const actual = jest.requireActual("react-dom");
  return { ...actual, createPortal: (node: unknown) => node };
});

jest.mock("../../../hooks/mutations/useActivitiesMutations", () => ({
  __esModule: true,
  default: () => ({ addActivity: jest.fn().mockResolvedValue(undefined) }),
}));

jest.mock("../../../hooks/mutations/useAllTransactionsMutations", () => ({
  __esModule: true,
  default: () => ({ addToAllTransactions: jest.fn().mockResolvedValue(undefined) }),
}));

jest.mock("../../../hooks/mutations/useFinancialsRoomMutations", () => ({
  __esModule: true,
  default: () => ({ saveFinancialsRoom: jest.fn().mockResolvedValue(undefined) }),
}));

const booking: CheckInRow = {
  bookingRef: "TEST-001",
  occupantId: "occ-001",
  checkInDate: "2026-03-08",
  rooms: ["101"],
  financials: {
    totalDue: 50,
    totalPaid: 0,
    balance: 50,
    totalAdjust: 0,
    transactions: {},
  },
};

describe("RoomPaymentButton", () => {
  it("renders amount label and is not disabled", () => {
    render(<RoomPaymentButton booking={booking} />);
    expect(screen.getByText("€50.00")).toBeInTheDocument();
    screen.getAllByRole("button").forEach((btn) => {
      expect(btn).not.toBeDisabled();
    });
  });

  it("opens popover on icon click, shows Confirm Payment and split row input", async () => {
    render(<RoomPaymentButton booking={booking} />);

    // Click the left icon button to open the popover
    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[0]);

    expect(screen.getByRole("button", { name: /confirm payment/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Amount")).toBeInTheDocument();
  });

  it("usePaymentContext inside provider returns value without throwing", () => {
    const mockCtx = {
      outstanding: 50,
      splitPayments: [{ id: "x", amount: 50, payType: "CC" as const }],
      isDisabled: false,
      handleAmountChange: jest.fn(),
      handleSetPayType: jest.fn(),
      handleAddPaymentRow: jest.fn(),
      handleRemovePaymentRow: jest.fn(),
      handleImmediatePayment: jest.fn().mockResolvedValue(undefined),
    };

    let capturedCtx: ReturnType<typeof usePaymentContext> | null = null;

    function Consumer() {
      capturedCtx = usePaymentContext();
      return null;
    }

    render(
      <PaymentContext.Provider value={mockCtx}>
        <Consumer />
      </PaymentContext.Provider>
    );

    expect(capturedCtx).not.toBeNull();
    expect(capturedCtx!.outstanding).toBe(50);
  });

  it("usePaymentContext outside provider throws", () => {
    function BadConsumer() {
      usePaymentContext();
      return null;
    }

    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<BadConsumer />)).toThrow(
      "usePaymentContext must be used within a PaymentProvider"
    );
    consoleSpy.mockRestore();
  });
});
