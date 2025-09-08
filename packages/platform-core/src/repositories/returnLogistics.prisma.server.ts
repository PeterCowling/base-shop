import "server-only";

import type { ReturnLogistics } from "@acme/types";
import { jsonReturnLogisticsRepository } from "./returnLogistics.json.server";

// TODO: replace with real Prisma implementation
export async function readReturnLogistics(): Promise<ReturnLogistics> {
  return jsonReturnLogisticsRepository.readReturnLogistics();
}

export async function writeReturnLogistics(
  data: ReturnLogistics,
): Promise<void> {
  await jsonReturnLogisticsRepository.writeReturnLogistics(data);
}

export const prismaReturnLogisticsRepository = {
  readReturnLogistics,
  writeReturnLogistics,
};

export type { ReturnLogistics };

