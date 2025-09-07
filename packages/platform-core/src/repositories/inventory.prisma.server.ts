import "server-only";

import type { InventoryRepository } from "./inventory.types";

export const prismaInventoryRepository: InventoryRepository = {
  async read() {
    throw new Error("Prisma inventory repository not implemented");
  },
  async write() {
    throw new Error("Prisma inventory repository not implemented");
  },
  async update() {
    throw new Error("Prisma inventory repository not implemented");
  },
};
