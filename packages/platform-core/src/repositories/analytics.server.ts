import "server-only";

import type { PrismaClient } from "@prisma/client";

import type { AnalyticsAggregates, AnalyticsEvent } from "../analytics";
import { prisma } from "../db";

import { resolveRepo } from "./repoResolver";

interface AnalyticsRepository {
  listEvents(shop?: string): Promise<AnalyticsEvent[]>;
  readAggregates(shop: string): Promise<AnalyticsAggregates>;
}

let repoPromise: Promise<AnalyticsRepository> | undefined;

async function getRepo(): Promise<AnalyticsRepository> {
  if (!repoPromise) {
    repoPromise = resolveRepo<AnalyticsRepository>(
      () =>
        (
          prisma as PrismaClient & { analyticsEvent?: unknown }
        ).analyticsEvent,
      () =>
        import("./analytics.prisma.server").then(
          (m) => m.prismaAnalyticsRepository,
        ),
      () =>
        import("./analytics.json.server").then(
          (m) => m.jsonAnalyticsRepository,
        ),
      { backendEnvVar: "ANALYTICS_BACKEND" },
    );
  }
  return repoPromise;
}

export async function listEvents(
  shop?: string,
): Promise<AnalyticsEvent[]> {
  const repo = await getRepo();
  return repo.listEvents(shop);
}

export async function readAggregates(
  shop: string,
): Promise<AnalyticsAggregates> {
  const repo = await getRepo();
  return repo.readAggregates(shop);
}

