// packages/platform-core/src/shipping/index.ts

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
import { env } from "@acme/config";

export async function getShippingRate({
  provider,
  fromPostalCode,
  toPostalCode,
  weight,
}: ShippingRateRequest): Promise<unknown> {
  const key = provider === "ups" ? "UPS_KEY" : "DHL_KEY";
  const apiKey = env[key];
  if (!apiKey) {
    throw new Error(`Missing ${key}`);
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
