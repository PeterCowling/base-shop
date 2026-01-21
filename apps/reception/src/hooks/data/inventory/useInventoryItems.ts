import { useMemo } from "react";

import { inventoryItemsSchema } from "../../../schemas/inventoryItemSchema";
import type { InventoryItem } from "../../../types/hooks/data/inventoryItemData";
import useFirebaseSubscription from "../useFirebaseSubscription";

export default function useInventoryItems() {
  const { data, loading, error } = useFirebaseSubscription<
    Record<string, InventoryItem>
  >("inventory/items", inventoryItemsSchema);

  const items = useMemo(
    () =>
      Object.entries(data ?? {}).map(([id, item]) => ({
        ...item,
        id,
      })),
    [data]
  );

  const itemsById = useMemo(() => {
    return items.reduce<Record<string, InventoryItem>>((acc, item) => {
      if (item.id) {
        acc[item.id] = item;
      }
      return acc;
    }, {});
  }, [items]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  return useMemo(
    () => ({
      items: sortedItems,
      itemsById,
      loading,
      error,
    }),
    [sortedItems, itemsById, loading, error]
  );
}