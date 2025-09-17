"use client";

import {
  Button,
  Input,
  TableCell,
  TableRow,
} from "@/components/atoms/shadcn";
import type { InventoryItem } from "@platform-core/types/inventory";
import type { ChangeEvent } from "react";

interface Props {
  item: InventoryItem;
  index: number;
  attributes: string[];
  updateItem: (
    index: number,
    field: keyof InventoryItem | `variantAttributes.${string}`,
    value: string,
  ) => void;
  deleteRow: (idx: number) => void;
}

/** Renders a single inventory row with controls for editing values. */
export default function InventoryRow({
  item,
  index,
  attributes,
  updateItem,
  deleteRow,
}: Props) {
  return (
    <TableRow key={index} className="border-white/5 bg-white/5 text-white/90">
      <TableCell className="min-w-[10rem]">
        <Input
          className="border-white/10 bg-slate-900/70 text-white shadow-inner"
          value={item.sku}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateItem(index, "sku", e.target.value)
          }
        />
      </TableCell>
      {attributes.map((attr) => (
        <TableCell key={attr} className="min-w-[8rem]">
          <Input
            className="border-white/10 bg-slate-900/70 text-white shadow-inner"
            value={item.variantAttributes[attr] ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateItem(index, `variantAttributes.${attr}`, e.target.value)
            }
          />
        </TableCell>
      ))}
      <TableCell>
        <Input
          className="border-white/10 bg-slate-900/70 text-white shadow-inner"
          type="number"
          min={0}
          value={Number.isNaN(item.quantity) ? "" : item.quantity}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateItem(index, "quantity", e.target.value)
          }
        />
      </TableCell>
      <TableCell>
        <Input
          className="border-white/10 bg-slate-900/70 text-white shadow-inner"
          type="number"
          min={0}
          value={item.lowStockThreshold ?? ""}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateItem(index, "lowStockThreshold", e.target.value)
          }
        />
      </TableCell>
      <TableCell>
        <Button
          type="button"
          variant="ghost"
          className="h-9 rounded-lg px-3 text-xs text-white hover:bg-white/10"
          onClick={() => deleteRow(index)}
          aria-label="delete-row"
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );
}
