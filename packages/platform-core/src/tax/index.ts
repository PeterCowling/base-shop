// packages/platform-core/src/tax/index.ts

export interface TaxCalculationRequest {
  provider: "taxjar";
  amount: number;
  toCountry: string;
  toPostalCode?: string;
}

/**
 * Calculate taxes using the configured provider API.
 */
export async function calculateTax({ provider, ...payload }: TaxCalculationRequest): Promise<unknown> {
  const apiKey = process.env[`${provider.toUpperCase()}_KEY`];
  if (!apiKey) {
    throw new Error(`Missing ${provider.toUpperCase()}_KEY`);
  }

  const url = "https://api.taxjar.com/v2/taxes";

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Failed to calculate tax with ${provider}`);
  }

  return res.json();
}
