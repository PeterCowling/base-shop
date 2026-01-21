"use client";

import Providers from "@/components/Providers";
import Prepayments from "@/components/prepayments/PrepaymentsContainer";

export default function PrepaymentsPage() {
  return (
    <Providers>
      <Prepayments setMessage={() => {}} />
    </Providers>
  );
}
