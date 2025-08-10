// packages/platform-core/src/tax/index.ts
import { fetchTaxJar } from './taxjar';
import type { TaxRequest } from './types';
import type { DefaultTaxProvider } from '../createShop/defaultTaxProviders';

export type { TaxRequest } from './types';

/**
 * Calculate tax using the specified provider.
 */
export async function calculateTax(
  provider: DefaultTaxProvider,
  req: TaxRequest,
  apiKey: string
): Promise<number> {
  switch (provider) {
    case 'taxjar':
      return fetchTaxJar(req, apiKey);
    default:
      throw new Error(`Unsupported tax provider: ${provider}`);
  }
}
