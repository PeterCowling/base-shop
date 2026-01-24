/* File: src/components/bar/sales/TicketList.tsx */
import { type FC, memo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { type SalesOrder } from "../../../types/bar/BarTypes";

import Ticket from "./Ticket";

interface Props {
  orders: SalesOrder[];
  filter: "ALL" | "BDS" | "KDS";
  removeItems: (o: SalesOrder, f: "ALL" | "BDS" | "KDS") => void;
  removeSingleItem: (o: SalesOrder, i: number) => void;
}

/** Responsive grid of order tickets with exit/enter animations */
const TicketList: FC<Props> = memo(
  ({ orders, filter, removeItems, removeSingleItem }) => {
    const reduceMotion = useReducedMotion();
    const motionProps = reduceMotion
      ? {
          layout: false,
          initial: false,
          animate: { opacity: 1 },
          exit: { opacity: 1 },
          transition: { duration: 0 },
        }
      : {
          layout: true,
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.9 },
          transition: { duration: 0.3 },
        };

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div key={order.orderKey} {...motionProps}>
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
    );
  }
);
TicketList.displayName = "TicketList";
export default TicketList;
