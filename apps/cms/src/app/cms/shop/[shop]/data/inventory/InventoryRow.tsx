"use client";

import {
  Button,
  Input,
  TableCell,
  TableRow,
} from "@/components/atoms/shadcn";
import type { InventoryItem } from "@acme/types";
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
    <TableRow key={index}>
      <TableCell>
        <Input
          value={item.sku}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateItem(index, "sku", e.target.value)
          }
        />
      </TableCell>
      {attributes.map((attr) => (
        <TableCell key={attr}>
          <Input
            value={item.variantAttributes[attr] ?? ""}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              updateItem(index, `variantAttributes.${attr}`, e.target.value)
            }
          />
        </TableCell>
      ))}
      <TableCell>
        <Input
          type="number"
          min={0}
          value={item.quantity}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            updateItem(index, "quantity", e.target.value)
          }
        />
      </TableCell>
      <TableCell>
        <Input
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
          onClick={() => deleteRow(index)}
          aria-label="delete-row"
        >
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );
}

