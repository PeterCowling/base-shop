"use client";

import Providers from "@/components/Providers";
import ReconciliationWorkbench from "@/components/till/ReconciliationWorkbench";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function ReconciliationWorkbenchPage() {
  return (
    <Providers>
      <ReconciliationWorkbench />
    </Providers>
  );
}
