import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useContext,
  useMemo,
} from "react";

import type {
  PaymentSplit,
  PaymentType,
} from "../../../types/component/roomButton/types";

export interface PaymentContextValue {
  splitPayments: PaymentSplit[];
  outstanding: number;
  isDisabled: boolean;
  handleAmountChange: (index: number, newAmount: string) => void;
  handleSetPayType: (index: number, newPayType: PaymentType) => void;
  handleAddPaymentRow: () => void;
  handleRemovePaymentRow: (index: number) => void;
  handleImmediatePayment: (
    event: MouseEvent<HTMLButtonElement>
  ) => Promise<void>;
}

export const PaymentContext = createContext<PaymentContextValue | undefined>(
  undefined
);

interface PaymentProviderProps extends PaymentContextValue {
  children: ReactNode;
}

export function PaymentProvider({
  children,
  splitPayments,
  outstanding,
  isDisabled,
  handleAmountChange,
  handleSetPayType,
  handleAddPaymentRow,
  handleRemovePaymentRow,
  handleImmediatePayment,
}: PaymentProviderProps) {
  const value = useMemo<PaymentContextValue>(
    () => ({
      splitPayments,
      outstanding,
      isDisabled,
      handleAmountChange,
      handleSetPayType,
      handleAddPaymentRow,
      handleRemovePaymentRow,
      handleImmediatePayment,
    }),
    [
      splitPayments,
      outstanding,
      isDisabled,
      handleAmountChange,
      handleSetPayType,
      handleAddPaymentRow,
      handleRemovePaymentRow,
      handleImmediatePayment,
    ]
  );

  return (
    <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>
  );
}

export function usePaymentContext(): PaymentContextValue {
  const ctx = useContext(PaymentContext);
  if (!ctx) {
    throw new Error("usePaymentContext must be used within a PaymentProvider");
  }
  return ctx;
}
