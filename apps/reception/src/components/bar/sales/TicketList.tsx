/* File: src/components/bar/sales/TicketList.tsx */
import { AnimatePresence, motion } from "framer-motion";
import { FC, memo } from "react";

import Ticket from "./Ticket";
import { SalesOrder } from "../../../types/bar/BarTypes";

interface Props {
  orders: SalesOrder[];
  filter: "ALL" | "BDS" | "KDS";
  removeItems: (o: SalesOrder, f: "ALL" | "BDS" | "KDS") => void;
  removeSingleItem: (o: SalesOrder, i: number) => void;
}

/** Responsive grid of order tickets with exit/enter animations */
const TicketList: FC<Props> = memo(
  ({ orders, filter, removeItems, removeSingleItem }) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <AnimatePresence>
        {orders.map((order) => (
          <motion.div
            key={order.orderKey}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
          >
            <Ticket
              order={order}
              filter={filter}
              removeItems={removeItems}
              removeSingleItem={removeSingleItem}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
);
TicketList.displayName = "TicketList";
export default TicketList;
