"use client";

import Providers from "@/components/Providers";
import VarianceHeatMap from "@/components/reports/VarianceHeatMap";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function VarianceHeatmapPage() {
  return (
    <Providers>
      <VarianceHeatMap />
    </Providers>
  );
}
