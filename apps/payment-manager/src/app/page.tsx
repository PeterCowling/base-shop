import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { hasPmSessionFromCookieHeader } from "../lib/auth/session";

export default async function PaymentManagerHomePage() {
  const cookieHeader = (await headers()).get("cookie");
  const authenticated = await hasPmSessionFromCookieHeader(cookieHeader);
  if (!authenticated) {
    redirect("/login");
  }

  return (
    <main className="min-h-dvh bg-gate-bg text-gate-ink">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold">Payment Manager</h1>
        <p className="mt-2 text-gate-muted">
          Central payment lifecycle management. Select a shop to manage payment
          provider configuration, view orders, and process refunds.
        </p>
      </div>
    </main>
  );
}
