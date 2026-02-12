export const BRIKETTE_HOW_TO_GET_HERE_BASE_URL = 'https://www.hostelbrikette.com/en/how-to-get-here';

export const PRIME_CANONICAL_INBOUND_ROUTE_SLUGS = [
  'amalfi-positano-bus',
  'amalfi-positano-ferry',
  'capri-positano-ferry',
  'naples-airport-positano-bus',
  'naples-center-positano-ferry',
  'naples-center-train-bus',
  'ravello-positano-bus',
  'salerno-positano-bus',
  'salerno-positano-ferry',
  'sorrento-positano-bus',
  'sorrento-positano-ferry',
] as const;

export type PrimeCanonicalInboundRouteSlug = (typeof PRIME_CANONICAL_INBOUND_ROUTE_SLUGS)[number];

const PRIME_CANONICAL_INBOUND_ROUTE_SET = new Set<string>(PRIME_CANONICAL_INBOUND_ROUTE_SLUGS);

export function isPrimeCanonicalInboundRouteSlug(value: string): value is PrimeCanonicalInboundRouteSlug {
  return PRIME_CANONICAL_INBOUND_ROUTE_SET.has(value);
}

export function toPrimeCanonicalRouteUrl(slug: PrimeCanonicalInboundRouteSlug): string {
  return `${BRIKETTE_HOW_TO_GET_HERE_BASE_URL}/${slug}`;
}
