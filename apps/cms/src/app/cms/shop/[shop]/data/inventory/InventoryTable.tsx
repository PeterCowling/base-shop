"use client";

import {
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/shadcn";
import type { InventoryItem } from "@platform-core/types/inventory";
import InventoryRow from "./InventoryRow";

interface InventoryTableProps {
  items: InventoryItem[];
  attributes: string[];
  onDeleteAttribute: (attribute: string) => void;
  onUpdateItem: (
    index: number,
    field: keyof InventoryItem | `variantAttributes.${string}`,
    value: string,
  ) => void;
  onDeleteRow: (index: number) => void;
}

export function InventoryTable({
  items,
  attributes,
  onDeleteAttribute,
  onUpdateItem,
  onDeleteRow,
}: InventoryTableProps) {
  return (
    <Card className="border border-white/10 bg-white/5 text-white">
      <CardContent className="px-0 py-0">
        <Table className="text-white">
          <TableHeader className="bg-white/10">
            <TableRow className="text-xs uppercase tracking-wide text-white/70">
              <TableHead className="text-white">SKU</TableHead>
              {attributes.map((attr) => (
                <TableHead key={attr} className="text-white">
                  <div className="flex items-center justify-between gap-2">
                    <span>{attr}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 rounded-lg px-2 text-xs text-white/70 hover:bg-white/10"
                      onClick={() => onDeleteAttribute(attr)}
                      aria-label={`delete-attr-${attr}`}
                    >
                      Remove
                    </Button>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-white">Quantity</TableHead>
              <TableHead className="text-white">Low stock threshold</TableHead>
              <TableHead className="text-white">&nbsp;</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <InventoryRow
                key={idx}
                item={item}
                index={idx}
                attributes={attributes}
                updateItem={onUpdateItem}
                deleteRow={onDeleteRow}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
