import { createCloudflareProvider } from "./providers/cloudflare";
import { createManagedTryOnProvider } from "./providers/garment/managed";
import type { TryOnProvider } from "./providers/types";

export const BUDGET = { preprocessMs: 1500, enhanceMs: 6000 } as const;

export function getProvider(): TryOnProvider {
  const provider = (process.env.TRYON_PROVIDER || "workers-ai").toLowerCase();
  if (provider === "workers-ai") return createCloudflareProvider();
  if (provider === "external-api") return createManagedTryOnProvider();
  return {};
}
