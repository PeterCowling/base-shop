// scripts/src/init-shop.ts
// Orchestrator that ensures the runtime is compatible and delegates to the
// environment and prompt logic.
import { ensureRuntime } from "./runtime";
import { initShop } from "./env";

ensureRuntime();

initShop().catch((err) => {
  console.error(err);
  process.exit(1);
});
