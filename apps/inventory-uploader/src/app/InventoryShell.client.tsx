"use client";

import type { ReactNode } from "react";

import { LogoutButton } from "../components/console/LogoutButton.client";
import { ThemeToggle } from "../components/ThemeToggle.client";

import styles from "./inventory.module.css";

type InventoryShellProps = {
  displayClassName: string;
  headerExtra?: ReactNode;
  children: ReactNode;
};

export default function InventoryShell({
  displayClassName,
  headerExtra,
  children,
}: InventoryShellProps) {
  return (
    <main className={`${displayClassName} relative min-h-dvh overflow-hidden bg-gate-bg text-gate-ink`}>
      <header className={`bg-gate-header border-b border-gate-header-accent ${styles.inventoryFade}`}>
        {/* eslint-disable-next-line ds/container-widths-only-at -- INV-0001 operator-tool page layout */}
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
          <h1 className="text-sm font-semibold text-gate-header-fg">Inventory</h1>
          <div className="ms-auto flex items-center gap-3">
            {headerExtra}
            <LogoutButton />
            <ThemeToggle variant="dark" />
          </div>
        </div>
      </header>

      <div className={`mx-auto max-w-6xl px-6 py-8 ${styles.inventoryFade}`}>{children}</div>
    </main>
  );
}
