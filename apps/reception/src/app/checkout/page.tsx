"use client";

import CheckoutComponent from "@/components/checkout/Checkout";
import Providers from "@/components/Providers";

// Prevent static prerendering — Firebase RTDB requires runtime env vars
export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <Providers>
      <CheckoutComponent />
    </Providers>
  );
}
