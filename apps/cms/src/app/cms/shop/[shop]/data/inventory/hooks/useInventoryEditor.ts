import { useCallback, useState } from "react";
import type { InventoryItem } from "@acme/platform-core/types/inventory";

export type InventoryStatus = "idle" | "saved" | "error";

function deriveAttributes(items: InventoryItem[]) {
  const set = new Set<string>();
  items.forEach((item) => {
    Object.keys(item.variantAttributes ?? {}).forEach((key) => set.add(key));
  });
  return Array.from(set);
}

export function useInventoryEditor(initialItems: InventoryItem[]) {
  const [items, setItems] = useState<InventoryItem[]>(() => initialItems);
  const [attributes, setAttributes] = useState<string[]>(() =>
    deriveAttributes(initialItems),
  );
  const [status, setStatus] = useState<InventoryStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const replaceItems = useCallback((nextItems: InventoryItem[]) => {
    setItems(nextItems);
    setAttributes(deriveAttributes(nextItems));
  }, []);

  const updateItem = useCallback(
    (
      index: number,
      field: keyof InventoryItem | `variantAttributes.${string}`,
      value: string,
    ) => {
      setItems((prev) => {
        const next = [...prev];
        const item = { ...next[index] } as InventoryItem;
        if (field.startsWith("variantAttributes.")) {
          const key = field.split(".")[1]!;
          item.variantAttributes = {
            ...item.variantAttributes,
            [key]: value,
          };
        } else if (field === "quantity") {
          item.quantity = value === "" ? NaN : Number(value);
        } else if (field === "lowStockThreshold") {
          item.lowStockThreshold = value === "" ? undefined : Number(value);
        } else if (field === "sku") {
          item.sku = value;
          item.productId = value;
        } else if (field === "productId") {
          item.productId = value;
        } else if (field === "wearCount") {
          item.wearCount = value === "" ? undefined : Number(value);
        } else if (field === "wearAndTearLimit") {
          item.wearAndTearLimit = value === "" ? undefined : Number(value);
        } else if (field === "maintenanceCycle") {
          item.maintenanceCycle = value === "" ? undefined : Number(value);
        }
        next[index] = item;
        return next;
      });
    },
    [],
  );

  const addRow = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        sku: "",
        productId: "",
        variantAttributes: Object.fromEntries(
          attributes.map((attribute) => [attribute, ""]),
        ),
        quantity: NaN,
        lowStockThreshold: undefined,
      },
    ]);
  }, [attributes]);

  const addAttribute = useCallback(
    (name: string) => {
      setAttributes((prev) => {
        if (!name || prev.includes(name)) {
          return prev;
        }
        setItems((items) =>
          items.map((item) => ({
            ...item,
            variantAttributes: {
              ...item.variantAttributes,
              [name]: item.variantAttributes?.[name] ?? "",
            },
          })),
        );
        return [...prev, name];
      });
    },
    [],
  );

  const deleteAttribute = useCallback((attr: string) => {
    setAttributes((prev) => {
      if (!prev.includes(attr)) {
        return prev;
      }
      setItems((items) =>
        items.map((item) => {
          if (!item.variantAttributes || !(attr in item.variantAttributes)) {
            return item;
          }
          const nextAttributes = { ...item.variantAttributes };
          delete nextAttributes[attr];
          return { ...item, variantAttributes: nextAttributes };
        }),
      );
      return prev.filter((name) => name !== attr);
    });
  }, []);

  const deleteRow = useCallback((idx: number) => {
    setItems((prev) => prev.filter((_, index) => index !== idx));
  }, []);

  const markSaved = useCallback(() => {
    setStatus("saved");
    setError(null);
  }, []);

  const markError = useCallback((message: string) => {
    setStatus("error");
    setError(message);
  }, []);

  const resetStatus = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return {
    items,
    attributes,
    status,
    error,
    updateItem,
    addRow,
    addAttribute,
    deleteAttribute,
    deleteRow,
    replaceItems,
    markSaved,
    markError,
    resetStatus,
  };
}
