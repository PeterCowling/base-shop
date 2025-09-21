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
    <Card className="border border-border/10 bg-surface-2 text-foreground">
      <CardContent className="px-0 py-0">
        <Table className="text-foreground">
          <TableHeader className="bg-surface-2">
            <TableRow className="text-xs uppercase tracking-wide text-muted-foreground">
              <TableHead className="text-foreground">SKU</TableHead>
              {attributes.map((attr) => (
                <TableHead key={attr} className="text-foreground">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0">{attr}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-7 shrink-0 rounded-lg px-2 text-xs text-muted-foreground hover:bg-surface-3"
                      onClick={() => onDeleteAttribute(attr)}
                      aria-label={`delete-attr-${attr}`}
                    >
                      Remove
                    </Button>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-foreground">Quantity</TableHead>
              <TableHead className="text-foreground">Low stock threshold</TableHead>
              <TableHead className="text-foreground">&nbsp;</TableHead>
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
