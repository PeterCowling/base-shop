"use client";

import LoansComp from "@/components/loans/Loans";
import Providers from "@/components/Providers";
import { useLegacyAuth } from "@/context/AuthContext";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

function LoanItemsContent() {
  const { user } = useLegacyAuth();
  return <LoansComp username={user?.user_name ?? ""} />;
}

export default function LoanItemsPage() {
  return (
    <Providers>
      <LoanItemsContent />
    </Providers>
  );
}
