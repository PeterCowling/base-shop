// packages/platform-core/src/shipping/ups.ts
import type { ShippingRateRequest } from './types';

/**
 * Call UPS API to retrieve shipping rate.
 * This is a minimal wrapper around their rate endpoint.
 */
export async function fetchUpsRate(
  req: ShippingRateRequest,
  apiKey: string
): Promise<number> {
  const res = await fetch('https://onlinetools.ups.com/rest/Rate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('UPS API error');
  const data = (await res.json()) as { rate?: number };
  if (typeof data.rate !== 'number') throw new Error('Invalid UPS response');
  return data.rate;
}
