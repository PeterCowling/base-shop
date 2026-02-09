"use client";

import Providers from "@/components/Providers";
import TillReconciliation from "@/components/till/Till";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function TillReconciliationPage() {
  return (
    <Providers>
      <TillReconciliation />
    </Providers>
  );
}
