import "server-only";

import type { AnalyticsAggregates, AnalyticsEvent } from "../analytics";

import { jsonAnalyticsRepository } from "./analytics.json.server";

export async function listEvents(
  shop?: string,
): Promise<AnalyticsEvent[]> {
  return jsonAnalyticsRepository.listEvents(shop);
}

export async function readAggregates(
  shop: string,
): Promise<AnalyticsAggregates> {
  return jsonAnalyticsRepository.readAggregates(shop);
}

export const prismaAnalyticsRepository = {
  listEvents,
  readAggregates,
};

