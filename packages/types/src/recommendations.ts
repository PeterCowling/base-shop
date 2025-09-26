import type { SKU } from "./Product";

export type RecommendationPreset =
  | "featured"
  | "new"
  | "bestsellers"
  | "clearance"
  | "limited";

export interface RecommendationRequest {
  preset?: RecommendationPreset;
  seed?: string;
  limit?: number;
  cacheKey?: string;
  ttlMs?: number;
}

export interface RecommendationResponse {
  items: SKU[];
}

