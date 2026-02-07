"use client";

import Providers from "@/components/Providers";
import SafeReconciliation from "@/components/safe/SafeReconciliation";
import { SafeDataProvider } from "@/context/SafeDataContext";

export default function SafeReconciliationPage() {
  return (
    <Providers>
      <SafeDataProvider>
        <SafeReconciliation />
      </SafeDataProvider>
    </Providers>
  );
}
