"use client";

import { redirect } from "next/navigation";

export default function CheckoutSuccessPage() {
  redirect("/cart");
}

