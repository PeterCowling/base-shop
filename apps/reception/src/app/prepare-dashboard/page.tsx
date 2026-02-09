"use client";

import PrepareDashboard from "@/components/prepare/PrepareDashboard";
import Providers from "@/components/Providers";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function PrepareDashboardPage() {
  return (
    <Providers>
      <PrepareDashboard />
    </Providers>
  );
}
