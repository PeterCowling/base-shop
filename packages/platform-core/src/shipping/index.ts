// packages/platform-core/src/shipping/index.ts

import { env } from "@acme/config";

export interface ShippingRateRequest {
  provider: "ups" | "dhl";
  fromPostalCode: string;
  toPostalCode: string;
  weight: number;
}

/**
 * Fetch a shipping rate from the configured provider.
 * The underlying provider API is called using the respective API key.
 */
export async function getShippingRate({
  provider,
  fromPostalCode,
  toPostalCode,
  weight,
}: ShippingRateRequest): Promise<unknown> {
  const apiKey =
    provider === "ups" ? env.UPS_KEY : provider === "dhl" ? env.DHL_KEY : undefined;
  if (!apiKey) {
    throw new Error(`Missing ${provider.toUpperCase()}_KEY`);
  }

  const url =
    provider === "ups"
      ? "https://onlinetools.ups.com/ship/v1/rating/Rate"
      : "https://api.dhl.com/rates";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ fromPostalCode, toPostalCode, weight }),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch rate from ${provider}`);
  }

  return res.json();
}
