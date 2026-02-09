"use client";

import Providers from "@/components/Providers";
import EndOfDayPacket from "@/components/reports/EndOfDayPacket";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function EndOfDayPage() {
  return (
    <Providers>
      <EndOfDayPacket />
    </Providers>
  );
}
