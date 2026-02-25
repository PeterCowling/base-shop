/* File: src/components/bar/sales/Ticket.tsx */
import { type FC, memo, useCallback } from "react";

import { useOrderAgeColor } from "../../../hooks/orchestrations/bar/actions/clientActions/useOrderAgeColor";
import { type SalesOrder } from "../../../types/bar/BarTypes";

import TicketItems from "./TicketItems";

interface Props {
  order: SalesOrder;
  filter: "ALL" | "BDS" | "KDS";
  removeItems: (o: SalesOrder, f: "ALL" | "BDS" | "KDS") => void;
  removeSingleItem: (o: SalesOrder, i: number) => void;
}

/** A single order ticket (header shows age‑based colour, body shows lines) */
const Ticket: FC<Props> = memo(
  ({ order, filter, removeItems, removeSingleItem }) => {
    const { bleepNumber, time } = order;
    const ageColor = useOrderAgeColor(time);

    const handleHeaderDblClick = useCallback(
      () => removeItems(order, filter),
      [order, filter, removeItems]
    );

    return (
      <article className="flex flex-col overflow-hidden rounded-xl border border-border-2 bg-surface/90 shadow-md backdrop-blur-sm">
        {/* --- Ticket header --- */}
        <header
          className={`flex cursor-pointer items-center justify-between gap-4 px-4 py-2 transition-colors duration-1000 ${ageColor}`}
          onDoubleClick={handleHeaderDblClick}
        >
          <span className="text-shadow font-extrabold tracking-wider text-primary-fg">
            {bleepNumber}
          </span>
          <time
            dateTime={time}
            className="text-sm font-semibold text-primary-fg opacity-90"
          >
            {time}
          </time>
        </header>

        {/* --- Ticket body --- */}
        <TicketItems order={order} removeSingleItem={removeSingleItem} />
      </article>
    );
  }
);
Ticket.displayName = "Ticket";
export default Ticket;
