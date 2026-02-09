"use client";

import LoansComp from "@/components/loans/Loans";
import { useLegacyAuth } from "@/context/AuthContext";

export default function LoanItemsContent() {
  const { user } = useLegacyAuth();
  return <LoansComp username={user?.user_name ?? ""} />;
}
