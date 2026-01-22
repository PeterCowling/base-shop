/* src/hooks/components/checkin/useRoomData.ts */

import { useEffect, useState } from "react";

import { type Bookings } from "../../../types/domains/booking_old";

export interface Payment {
  amount: number;
  payType: string;
}

/**
 * Compute the occupant's remaining room balance
 * from their financials.transactions. If there's no transaction data,
 * we assume a 0 outstanding balance.
 */
export function computeOutstandingRoom(booking: Bookings | null): number {
  if (!booking?.financials?.transactions) return 0;

  const transactions = Array.isArray(booking.financials.transactions)
    ? booking.financials.transactions
    : Object.values(booking.financials.transactions);

  let totalDue = 0;
  let totalPaid = 0;

  transactions.forEach((txn) => {
    // Narrowing possible shape
    if (typeof txn === "object" && txn !== null) {
      if (txn.type === "charge") totalDue += txn.amount;
      if (txn.type === "payment") totalPaid += txn.amount;
    }
  });

  return totalDue - totalPaid;
}

export default function useRoomData(booking: Bookings | null) {
  const [payType, setPayType] = useState<string>("CASH");
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    if (!booking) {
      setAmount(0);
      return;
    }
    const outstanding = computeOutstandingRoom(booking);
    setAmount(outstanding);
  }, [booking, payType]);

  return {
    payType,
    setPayType,
    amount,
  };
}
