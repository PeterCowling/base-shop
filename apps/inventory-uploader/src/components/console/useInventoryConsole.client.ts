"use client";

import { useState } from "react";

/**
 * Pinned interface for the inventory console state.
 * TASK-04 adds selectedShop/setSelectedShop via this type.
 * TASK-06 reads selectedShop for inventory list fetching.
 * TASK-13 reads selectedSku for variant editor mounting.
 * Do not add catalog-specific fields here.
 */
export type InventoryConsoleState = {
  selectedShop: string | null;
  setSelectedShop: (shop: string | null) => void;
  selectedSku: string | null;
  setSelectedSku: (sku: string | null) => void;
};

export function useInventoryConsole(): InventoryConsoleState {
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);

  return {
    selectedShop,
    setSelectedShop,
    selectedSku,
    setSelectedSku,
  };
}
