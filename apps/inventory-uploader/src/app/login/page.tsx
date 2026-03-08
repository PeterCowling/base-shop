import { Work_Sans } from "next/font/google";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { hasInventorySessionFromCookieHeader } from "../../lib/auth/session";
import styles from "../inventory.module.css";

import { InventoryLoginClient } from "./InventoryLogin.client";

const display = Work_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export default async function InventoryLoginPage() {
  const cookieHeader = (await headers()).get("cookie");
  const authenticated = await hasInventorySessionFromCookieHeader(cookieHeader);
  if (authenticated) {
    redirect("/");
  }

  return (
    <main className={`${display.className} relative min-h-dvh overflow-hidden bg-gate-bg text-gate-ink`}>
      {/* eslint-disable-next-line ds/container-widths-only-at -- INV-0001 operator-tool page layout */}
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-16">
        <div className={`w-full overflow-hidden rounded-xl border border-gate-border bg-gate-surface shadow-elevation-2 ${styles.inventoryFade}`}>
          <div className="h-1 bg-gate-accent" />
          <div className="p-8">
            <div className="mb-6 space-y-1 text-center">
              <h1 className="text-xl font-semibold text-gate-ink">Inventory Console</h1>
            </div>
            <InventoryLoginClient />
          </div>
        </div>
      </div>
    </main>
  );
}
