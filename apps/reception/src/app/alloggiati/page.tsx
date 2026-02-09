"use client";

import Alloggiati from "@/components/man/Alloggiati";
import Providers from "@/components/Providers";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function AlloggiatiPage() {
  return (
    <Providers>
      <Alloggiati />
    </Providers>
  );
}
