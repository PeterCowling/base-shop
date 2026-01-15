"use client";

import Providers from "@/components/Providers";
import CheckoutComponent from "@/components/checkout/Checkout";

export default function CheckoutPage() {
  return (
    <Providers>
      <CheckoutComponent />
    </Providers>
  );
}
