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
      () => (prisma as any).returnLogistics,
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

export type { ReturnLogistics };

