// scripts/src/init-shop.ts
// Orchestrator that ensures the runtime is compatible and delegates to the
// environment and prompt logic.
import { initShop } from "./initShop";
import { ensureRuntime } from "./runtime";

ensureRuntime();

initShop().catch((err) => {
  console.error(err);
  process.exit(1);
});
