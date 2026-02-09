"use client";

import Stock from "@/components/man/Stock";
import Providers from "@/components/Providers";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function StockPage() {
  return (
    <Providers>
      <Stock />
    </Providers>
  );
}