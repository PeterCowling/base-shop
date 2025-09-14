import "server-only";

import type { PricingMatrix } from "@acme/types";
import { prisma } from "../db";
import { resolveRepo } from "./repoResolver";

interface PricingRepository {
  read(): Promise<PricingMatrix>;
  write(data: PricingMatrix): Promise<void>;
}

let repoPromise: Promise<PricingRepository> | undefined;

async function getRepo(): Promise<PricingRepository> {
  if (!repoPromise) {
    repoPromise = resolveRepo<PricingRepository>(
      () => prisma.pricing,
      () =>
        import("./pricing.prisma.server").then(
          (m) => m.prismaPricingRepository,
        ),
      () =>
        import("./pricing.json.server").then(
          (m) => m.jsonPricingRepository,
        ),
      { backendEnvVar: "PRICING_BACKEND" },
    );
  }
  return repoPromise;
}

export async function readPricing(): Promise<PricingMatrix> {
  const repo = await getRepo();
  return repo.read();
}

export async function writePricing(data: PricingMatrix): Promise<void> {
  const repo = await getRepo();
  return repo.write(data);
}

