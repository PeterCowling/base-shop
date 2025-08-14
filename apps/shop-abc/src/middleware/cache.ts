import { Redis } from "@upstash/redis";
import { env } from "@acme/config";

export interface Attempt {
  count: number;
  lockedUntil: number;
}

export const attempts = new Map<string, Attempt>();
export const registrationAttempts = new Map<string, Attempt>();
export const mfaAttempts = new Map<string, Attempt>();

export let redis: Redis | null = null;
if (env.LOGIN_RATE_LIMIT_REDIS_URL && env.LOGIN_RATE_LIMIT_REDIS_TOKEN) {
  redis = new Redis({
    url: env.LOGIN_RATE_LIMIT_REDIS_URL,
    token: env.LOGIN_RATE_LIMIT_REDIS_TOKEN,
  });
} else if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}
