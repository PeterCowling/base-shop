import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PaymentContextValue } from "../../../components/checkins/roomButton/PaymentContext";
import { PaymentContext } from "../../../components/checkins/roomButton/PaymentContext";
import type { PaymentSplit } from "../../../types/component/roomButton/types";
import PaymentForm from "../roomButton/PaymentForm";

jest.mock("react-dom", async () => {
  const actual = jest.requireActual("react-dom");
  return { ...actual, createPortal: (node: unknown) => node };
});

function makeCtx(overrides: Partial<PaymentContextValue> = {}): PaymentContextValue {
  return {
    outstanding: 10,
    splitPayments: [{ id: "1", amount: 10, payType: "CASH" }],
    isDisabled: false,
    handleAmountChange: jest.fn(),
    handleSetPayType: jest.fn(),
    handleAddPaymentRow: jest.fn(),
    handleRemovePaymentRow: jest.fn(),
    handleImmediatePayment: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("PaymentForm", () => {
  it("shows amount and opens dropdown", async () => {
    const ctx = makeCtx();
    render(
      <PaymentContext.Provider value={ctx}>
        <PaymentForm />
      </PaymentContext.Provider>
    );

    expect(screen.getByText("€10.00")).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole("button")[0]);
    expect(screen.getByRole("button", { name: /confirm payment/i })).toBeInTheDocument();
  });

  it("renders split label and disables buttons", () => {
    const splits: PaymentSplit[] = [
      { id: "1", amount: 5, payType: "CASH" },
      { id: "2", amount: 5, payType: "CC" },
    ];
    const ctx = makeCtx({ splitPayments: splits, isDisabled: true });
    render(
      <PaymentContext.Provider value={ctx}>
        <PaymentForm />
      </PaymentContext.Provider>
    );

    expect(screen.getByText("Split €10.00")).toBeInTheDocument();
    screen.getAllByRole("button").forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("calls handleImmediatePayment when right-hand amount button is clicked", async () => {
    const handleImmediatePayment = jest.fn().mockResolvedValue(undefined);
    const ctx = makeCtx({ handleImmediatePayment });
    render(
      <PaymentContext.Provider value={ctx}>
        <PaymentForm />
      </PaymentContext.Provider>
    );

    // Right-hand button is the second button (index 1)
    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[1]);
    expect(handleImmediatePayment).toHaveBeenCalled();
  });
});
