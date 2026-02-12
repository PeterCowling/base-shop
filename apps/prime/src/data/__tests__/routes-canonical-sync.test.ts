import { HOW_TO_GET_HERE_ROUTE_GUIDES } from '../../../../brikette/src/data/how-to-get-here/routeGuides';
import { ROUTES_TO_POSITANO } from '../routes';
import {
  BRIKETTE_HOW_TO_GET_HERE_BASE_URL,
  isPrimeCanonicalInboundRouteSlug,
  PRIME_CANONICAL_INBOUND_ROUTE_SLUGS,
  toPrimeCanonicalRouteUrl,
} from '../routesCanonical';

function getBriketteInboundSlugs(): string[] {
  return Object.values(HOW_TO_GET_HERE_ROUTE_GUIDES)
    .filter((guide) => guide.tags.includes('positano') && !guide.slug.startsWith('positano'))
    .map((guide) => guide.slug)
    .sort();
}

describe('Prime route canonical sync', () => {
  it('TC-01: canonical Brikette inbound slug set matches Prime canonical list', () => {
    const expectedInboundSlugs = getBriketteInboundSlugs();
    const primeInboundSlugs = [...PRIME_CANONICAL_INBOUND_ROUTE_SLUGS].sort();

    expect(primeInboundSlugs).toEqual(expectedInboundSlugs);
  });

  it('TC-02: every Prime route uses a canonical inbound slug and valid Brikette URL', () => {
    for (const route of ROUTES_TO_POSITANO) {
      expect(isPrimeCanonicalInboundRouteSlug(route.slug)).toBe(true);
      if (!isPrimeCanonicalInboundRouteSlug(route.slug)) {
        throw new Error(`Route slug ${route.slug} is not in Prime canonical inbound route set.`);
      }
      expect(route.briketteUrl).toBe(toPrimeCanonicalRouteUrl(route.slug));

      const parsed = new URL(route.briketteUrl);
      expect(parsed.origin).toBe('https://www.hostelbrikette.com');
      expect(parsed.pathname.startsWith('/en/how-to-get-here/')).toBe(true);
    }
  });

  it('TC-03: canonical URL helper emits Brikette base URL for known slugs', () => {
    for (const slug of PRIME_CANONICAL_INBOUND_ROUTE_SLUGS) {
      expect(toPrimeCanonicalRouteUrl(slug)).toBe(`${BRIKETTE_HOW_TO_GET_HERE_BASE_URL}/${slug}`);
    }
  });
});
