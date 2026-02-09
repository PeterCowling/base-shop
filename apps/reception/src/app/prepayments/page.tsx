"use client";

import Prepayments from "@/components/prepayments/PrepaymentsContainer";
import Providers from "@/components/Providers";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function PrepaymentsPage() {
  return (
    <Providers>
      <Prepayments setMessage={() => {}} />
    </Providers>
  );
}
