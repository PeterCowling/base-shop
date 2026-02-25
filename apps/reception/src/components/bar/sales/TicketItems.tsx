/* File: src/components/bar/sales/TicketItems.tsx */
import { type FC, memo, useCallback } from "react";

import { type SalesOrder } from "../../../types/bar/BarTypes";

interface Props {
  order: SalesOrder;
  removeSingleItem: (o: SalesOrder, i: number) => void;
}

/** List of individual line items with dbl‑click‑to‑remove */
const TicketItems: FC<Props> = memo(({ order, removeSingleItem }) => {
  const removeLine = useCallback(
    (i: number) => removeSingleItem(order, i),
    [order, removeSingleItem]
  );

  return (
    <ul className="divide-y divide-border-1 px-2 py-2">
      {order.items.map((it, i) => (
        <li
          key={it.id ?? crypto.randomUUID()}
          className="cursor-pointer rounded px-2 py-1 font-medium text-foreground transition hover:bg-surface-2 active:bg-surface-3"
          onDoubleClick={() => removeLine(i)}
        >
          {it.count === 1 ? it.product : `${it.count} × ${it.product}`}
        </li>
      ))}
    </ul>
  );
});
TicketItems.displayName = "TicketItems";
export default TicketItems;
