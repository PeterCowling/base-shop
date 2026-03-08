"use client";

import InventoryShell from "./InventoryShell.client";

/**
 * Root client wrapper for the inventory console.
 * TASK-12 will import InventoryConsole here and wire onHeaderExtra through.
 */
export default function InventoryHomeClient({
  displayClassName,
}: {
  displayClassName: string;
}) {
  return (
    <InventoryShell
      displayClassName={displayClassName}
    >
      {/* TASK-12: replace this placeholder with <InventoryConsole onHeaderExtra={...} /> */}
      <p className="py-24 text-center text-gate-muted text-sm">
        Inventory console loading…
      </p>
    </InventoryShell>
  );
}
