"use client";

import Providers from "@/components/Providers";
import SafeReconciliation from "@/components/safe/SafeReconciliation";
import { SafeDataProvider } from "@/context/SafeDataContext";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function SafeReconciliationPage() {
  return (
    <Providers>
      <SafeDataProvider>
        <SafeReconciliation />
      </SafeDataProvider>
    </Providers>
  );
}
