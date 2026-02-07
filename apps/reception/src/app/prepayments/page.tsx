"use client";

import Prepayments from "@/components/prepayments/PrepaymentsContainer";
import Providers from "@/components/Providers";

export default function PrepaymentsPage() {
  return (
    <Providers>
      <Prepayments setMessage={() => {}} />
    </Providers>
  );
}
