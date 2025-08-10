// packages/platform-core/src/shipping/index.ts
import { fetchDhlRate } from './dhl';
import { fetchUpsRate } from './ups';
import type { ShippingRateRequest } from './types';
import type { DefaultShippingProvider } from '../createShop/defaultShippingProviders';

export type { ShippingRateRequest } from './types';

/**
 * Fetch a shipping rate from the configured provider.
 */
export async function fetchShippingRate(
  provider: DefaultShippingProvider,
  req: ShippingRateRequest,
  apiKey: string
): Promise<number> {
  switch (provider) {
    case 'ups':
      return fetchUpsRate(req, apiKey);
    case 'dhl':
      return fetchDhlRate(req, apiKey);
    default:
      throw new Error(`Unsupported shipping provider: ${provider}`);
  }
}
