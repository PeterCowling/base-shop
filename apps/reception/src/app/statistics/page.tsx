"use client";

import Providers from "@/components/Providers";
import Statistics from "@/components/stats/Statistics";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function StatisticsPage() {
  return (
    <Providers>
      <Statistics />
    </Providers>
  );
}
