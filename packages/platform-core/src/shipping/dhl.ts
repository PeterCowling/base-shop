// packages/platform-core/src/shipping/dhl.ts
import type { ShippingRateRequest } from './types';

/**
 * Call DHL API to retrieve shipping rate.
 */
export async function fetchDhlRate(
  req: ShippingRateRequest,
  apiKey: string
): Promise<number> {
  const res = await fetch('https://api.dhl.com/rates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'DHL-API-Key': apiKey,
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('DHL API error');
  const data = (await res.json()) as { rate?: number };
  if (typeof data.rate !== 'number') throw new Error('Invalid DHL response');
  return data.rate;
}
