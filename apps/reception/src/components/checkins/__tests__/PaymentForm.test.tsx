/* eslint-env vitest */
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");
  return { ...actual, createPortal: (node: unknown) => node };
});

import PaymentForm from "../roomButton/PaymentForm";
import type { PaymentSplit } from "../../../types/component/roomButton/types";

describe("PaymentForm", () => {
  it("shows amount and opens dropdown", async () => {
    const splits: PaymentSplit[] = [{ id: "1", amount: 10, payType: "CASH" }];
    render(
      <PaymentForm
        outstanding={10}
        splitPayments={splits}
        handleAmountChange={vi.fn()}
        handleSetPayType={vi.fn()}
        handleAddPaymentRow={vi.fn()}
        handleRemovePaymentRow={vi.fn()}
        handleImmediatePayment={vi.fn()}
        isDisabled={false}
      />
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
    render(
      <PaymentForm
        outstanding={10}
        splitPayments={splits}
        handleAmountChange={vi.fn()}
        handleSetPayType={vi.fn()}
        handleAddPaymentRow={vi.fn()}
        handleRemovePaymentRow={vi.fn()}
        handleImmediatePayment={vi.fn()}
        isDisabled
      />
    );

    expect(screen.getByText("Split €10.00")).toBeInTheDocument();
    screen.getAllByRole("button").forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });
});
