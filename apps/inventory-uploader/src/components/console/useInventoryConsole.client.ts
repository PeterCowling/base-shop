"use client";

import { useCallback, useState } from "react";

import { SHOP_STORAGE_KEY } from "../../lib/inventory-utils";

/**
 * Pinned interface for the inventory console state.
 * TASK-04 adds selectedShop/setSelectedShop + localStorage persistence.
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

function readPersistedShop(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SHOP_STORAGE_KEY);
}

export function useInventoryConsole(): InventoryConsoleState {
  const [selectedShop, setSelectedShopRaw] = useState<string | null>(readPersistedShop);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);

  const setSelectedShop = useCallback(
    (shop: string | null) => {
      // Scoped state reset: clear selected SKU when shop changes
      setSelectedSku(null);
      setSelectedShopRaw(shop);
    },
    [],
  );

  return {
    selectedShop,
    setSelectedShop,
    selectedSku,
    setSelectedSku,
  };
}
