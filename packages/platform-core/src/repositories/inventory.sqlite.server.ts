import "server-only";
import type { InventoryRepository } from "./inventory.types";
import { jsonInventoryRepository } from "./inventory.json.server";

// Placeholder SQLite implementation delegating to JSON repository.
export const sqliteInventoryRepository: InventoryRepository =
  jsonInventoryRepository;
