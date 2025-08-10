// packages/platform-core/src/tax/taxjar.ts
import type { TaxRequest } from './types';

/**
 * Minimal TaxJar API wrapper to calculate sales tax.
 */
export async function fetchTaxJar(
  req: TaxRequest,
  apiKey: string
): Promise<number> {
  const res = await fetch('https://api.taxjar.com/v2/taxes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('Tax service error');
  const data = (await res.json()) as { tax?: { amount_to_collect?: number } };
  const amount = data.tax?.amount_to_collect;
  if (typeof amount !== 'number') throw new Error('Invalid TaxJar response');
  return amount;
}
