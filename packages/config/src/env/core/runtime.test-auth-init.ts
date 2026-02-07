import { loadAuthEnv } from "@acme/config/env/auth";

import { shouldUseTestDefaults } from "./constants.js";
import { snapshotForCoreEnv } from "./env.snapshot.js";

if (shouldUseTestDefaults()) {
  const snapshot = snapshotForCoreEnv();
  const redisSelected =
    typeof snapshot.SESSION_STORE === "string" &&
    snapshot.SESSION_STORE.toLowerCase() === "redis";
  const hasRedisUrl =
    typeof snapshot.UPSTASH_REDIS_REST_URL === "string" &&
    snapshot.UPSTASH_REDIS_REST_URL.trim() !== "";
  const hasRedisToken =
    typeof snapshot.UPSTASH_REDIS_REST_TOKEN === "string" &&
    snapshot.UPSTASH_REDIS_REST_TOKEN.trim() !== "";
  const hasRateLimitUrl =
    typeof snapshot.LOGIN_RATE_LIMIT_REDIS_URL === "string" &&
    snapshot.LOGIN_RATE_LIMIT_REDIS_URL.trim() !== "";
  const hasRateLimitToken =
    typeof snapshot.LOGIN_RATE_LIMIT_REDIS_TOKEN === "string" &&
    snapshot.LOGIN_RATE_LIMIT_REDIS_TOKEN.trim() !== "";

  if (
    redisSelected ||
    hasRedisUrl ||
    hasRedisToken ||
    hasRateLimitUrl ||
    hasRateLimitToken
  ) {
    const allowNumericTtl =
      (globalThis as Record<string, unknown>).__ACME_ALLOW_NUMERIC_TTL__ === true;
    loadAuthEnv(snapshot, { allowNumericTtl });
  }
}
