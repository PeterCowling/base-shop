"use client";

import { useState } from "react";

import { SHOP_STORAGE_KEY } from "../../lib/inventory-utils";

export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    if (busy) return;
    setBusy(true);

    // Clear shop selection before the server call so it is gone even if the
    // fetch fails and the page never fully reloads.
    localStorage.removeItem(SHOP_STORAGE_KEY);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors — cookie will expire naturally.
    }

    window.location.assign("/login");
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={busy}
      // eslint-disable-next-line ds/min-tap-size -- INV-0001 operator-desktop-tool compact layout
      className="rounded-md border border-gate-border px-2.5 py-1 text-2xs text-gate-muted transition hover:text-gate-ink disabled:cursor-not-allowed disabled:opacity-50"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
