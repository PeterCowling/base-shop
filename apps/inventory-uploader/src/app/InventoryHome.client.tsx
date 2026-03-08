"use client";

import * as React from "react";

import InventoryConsole from "../components/console/InventoryConsole.client";

import InventoryShell from "./InventoryShell.client";

/**
 * Root client wrapper for the inventory console.
 * onHeaderExtra is wired from InventoryConsole into InventoryShell header slot.
 */
export default function InventoryHomeClient({
  displayClassName,
}: {
  displayClassName: string;
}) {
  const [headerExtra, setHeaderExtra] = React.useState<React.ReactNode>(null);

  return (
    <InventoryShell
      displayClassName={displayClassName}
      headerExtra={headerExtra}
    >
      <InventoryConsole onHeaderExtra={setHeaderExtra} />
    </InventoryShell>
  );
}
