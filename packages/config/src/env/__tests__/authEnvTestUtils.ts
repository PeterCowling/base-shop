import { afterEach } from "@jest/globals";

export const NEXT_SECRET = "nextauth-secret-32-chars-long-string!";
export const SESSION_SECRET = "session-secret-32-chars-long-string!";
export const REDIS_URL = "https://example.com";
export const REDIS_TOKEN = "redis-token-32-chars-long-string!";
export const OAUTH_ISSUER = "https://auth.example.com/realms/base-shop";
export const OAUTH_REDIRECT_ORIGIN = "https://shop.example.com";
export const DEV_NEXTAUTH_SECRET = "dev-nextauth-secret-32-chars-long-string!";
export const DEV_SESSION_SECRET = "dev-session-secret-32-chars-long-string!";

export type BoolKey = "ALLOW_GUEST" | "ENFORCE_2FA";

export function selectStore(env: any): string {
  return (
    env.SESSION_STORE ??
    (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN ? "redis" : "memory")
  );
}

export function restoreEnv() {
  jest.restoreAllMocks();
}

afterEach(restoreEnv);
