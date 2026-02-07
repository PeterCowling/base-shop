"use client";

import CheckoutComponent from "@/components/checkout/Checkout";
import Providers from "@/components/Providers";

export default function CheckoutPage() {
  return (
    <Providers>
      <CheckoutComponent />
    </Providers>
  );
}
