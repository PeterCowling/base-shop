// packages/platform-core/src/repositories/rentalOrders.server.ts
import "server-only";

export {
  listOrders as readOrders,
  addOrder,
  markReturned,
  markRefunded,
  updateRisk,
} from "../orders";
