import "server-only";

import type { ReturnLogistics } from "@acme/types";
import { returnLogisticsSchema } from "@acme/types";

import { prisma } from "../db";

const SINGLETON_ID = 1;

export async function readReturnLogistics(): Promise<ReturnLogistics> {
  const row = await prisma.returnLogistics.findUnique({
    where: { id: SINGLETON_ID },
  });
  if (!row) {
    throw new Error("Return logistics not found"); // i18n-exempt -- ABC-123: Server-side internal error, not user-facing
  }
  const parsed = returnLogisticsSchema.safeParse(row.data);
  if (!parsed.success) {
    throw new Error("Invalid return logistics data"); // i18n-exempt -- ABC-123: Server-side internal error, not user-facing
  }
  return parsed.data;
}

export async function writeReturnLogistics(
  data: ReturnLogistics,
): Promise<void> {
  await prisma.returnLogistics.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, data },
    update: { data },
  });
}

export const prismaReturnLogisticsRepository = {
  readReturnLogistics,
  writeReturnLogistics,
};

export type { ReturnLogistics };
