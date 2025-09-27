import "server-only";

import type { ReturnLogistics } from "@acme/types";
import { prisma } from "../db";
import { resolveRepo } from "./repoResolver";

type ReturnLogisticsRepo = {
  readReturnLogistics(): Promise<ReturnLogistics>;
  writeReturnLogistics(data: ReturnLogistics): Promise<void>;
};

let repoPromise: Promise<ReturnLogisticsRepo> | undefined;

async function getRepo(): Promise<ReturnLogisticsRepo> {
  if (!repoPromise) {
    repoPromise = resolveRepo<ReturnLogisticsRepo>(
      () => (prisma as { returnLogistics?: unknown }).returnLogistics,
      () =>
        import("./returnLogistics.prisma.server").then(
          (m) => m.prismaReturnLogisticsRepository,
        ),
      () =>
        import("./returnLogistics.json.server").then(
          (m) => m.jsonReturnLogisticsRepository,
        ),
      { backendEnvVar: "RETURN_LOGISTICS_BACKEND" },
    );
  }
  return repoPromise;
}

export async function readReturnLogistics(): Promise<ReturnLogistics> {
  const repo = await getRepo();
  return repo.readReturnLogistics();
}

export async function writeReturnLogistics(
  data: ReturnLogistics,
): Promise<void> {
  const repo = await getRepo();
  return repo.writeReturnLogistics(data);
}

export interface ReturnLabelRequest {
  carrier: string;
  method: string;
  orderId: string;
}

export async function createReturnLabel(
  req: ReturnLabelRequest,
): Promise<{ trackingNumber: string; labelUrl: string }> {
  if (req.carrier !== "UPS") {
    throw new Error("unsupported carrier"); // i18n-exempt -- ABC-123: Server-side validation message, not displayed to end users
  }
  const tracking = `1Z${Math.floor(Math.random() * 1e10)
    .toString()
    .padStart(10, "0")}`;
  const labelUrl = `https://www.ups.com/track?loc=en_US&tracknum=${tracking}`;
  return { trackingNumber: tracking, labelUrl };
}

export type { ReturnLogistics };
