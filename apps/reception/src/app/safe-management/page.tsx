"use client";

import Providers from "@/components/Providers";
import SafeManagement from "@/components/safe/SafeManagement";
import { SafeDataProvider } from "@/context/SafeDataContext";
import { TillShiftProvider } from "@/hooks/client/till/TillShiftProvider";

export default function SafeManagementPage() {
  return (
    <Providers>
      <TillShiftProvider>
        <SafeDataProvider>
          <SafeManagement />
        </SafeDataProvider>
      </TillShiftProvider>
    </Providers>
  );
}
