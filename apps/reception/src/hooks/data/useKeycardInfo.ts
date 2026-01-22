import { useEffect, useState } from "react";

import useOccupantLoans from "../../components/loans/useOccupantLoans";
import type {
  LoanMethod,
  LoanTransaction,
} from "../../types/hooks/data/loansData";

export interface KeycardInfo {
  hasKeycard: boolean;
  depositType?: LoanMethod;
}

export default function useKeycardInfo(
  bookingRef: string,
  occupantId: string
): KeycardInfo {
  const { occupantLoans } = useOccupantLoans(bookingRef, occupantId);

  const [hasKeycard, setHasKeycard] = useState(false);
  const [depositType, setDepositType] = useState<LoanMethod | undefined>(
    undefined
  );

  useEffect(() => {
    if (!occupantLoans?.txns) {
      setHasKeycard(false);
      setDepositType(undefined);
      return;
    }

    let count = 0;
    const txns = Object.values(occupantLoans.txns) as LoanTransaction[];
    txns.forEach((t) => {
      if (t.item !== "Keycard") return;
      if (t.type === "Loan") count += t.count;
      else if (t.type === "Refund") count -= t.count;
    });
    setHasKeycard(count > 0);

    const latest = txns
      .filter(
        (t) =>
          (t.item === "Keycard" || t.item === "No_card") && t.type === "Loan"
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

    setDepositType(latest?.depositType);
  }, [occupantLoans]);

  return { hasKeycard, depositType };
}
