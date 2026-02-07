/**
 * Pre-arrival route data.
 *
 * Routes to Positano from common origins.
 * These are simplified summaries; full content lives in Brikette.
 */

import type { Route, RouteOrigin } from '../types/routes';
import { toPrimeCanonicalRouteUrl } from './routesCanonical';

/**
 * Available origin locations for route selection.
 */
export const ROUTE_ORIGINS: RouteOrigin[] = [
  // Airports
  { id: 'naples-airport', name: 'Naples Airport (NAP)', category: 'airport', icon: 'plane' },

  // Train stations
  { id: 'naples-centrale', name: 'Naples Centrale', category: 'train-station', icon: 'train' },
  { id: 'salerno-station', name: 'Salerno Station', category: 'train-station', icon: 'train' },

  // Ports / Cities
  { id: 'sorrento', name: 'Sorrento', category: 'city', icon: 'map-pin' },
  { id: 'amalfi', name: 'Amalfi', category: 'city', icon: 'map-pin' },
  { id: 'capri', name: 'Capri', category: 'port', icon: 'anchor' },
  { id: 'salerno-port', name: 'Salerno Port', category: 'port', icon: 'anchor' },
  { id: 'naples-port', name: 'Naples Port (Molo Beverello)', category: 'port', icon: 'anchor' },
  { id: 'ravello', name: 'Ravello', category: 'city', icon: 'map-pin' },
];

/**
 * Routes to Positano from various origins.
 */
export const ROUTES_TO_POSITANO: Route[] = [
  // === FROM NAPLES AIRPORT ===
  {
    slug: 'naples-airport-positano-bus',
    contentKey: 'howToGetHereNaplesAirportPositanoBus',
    title: 'Naples Airport to Positano by Bus',
    description: 'Take Curreri bus to Sorrento, then SITA bus to Positano. Most economical option.',
    origin: 'Naples Airport (NAP)',
    originCategory: 'airport',
    destination: 'Positano',
    primaryMode: 'bus',
    modes: ['bus', 'bus'],
    segments: [
      {
        mode: 'bus',
        from: 'Naples Airport',
        to: 'Sorrento',
        durationMinutes: 75,
        operator: 'Curreri Viaggi',
        notes: 'Direct bus, book online recommended',
      },
      {
        mode: 'bus',
        from: 'Sorrento',
        to: 'Positano (Chiesa Nuova)',
        durationMinutes: 60,
        operator: 'SITA Sud',
        notes: 'Scenic coastal road, can be crowded in summer',
      },
    ],
    totalDurationMinutes: 135,
    costRange: { min: 15, max: 25 },
    warnings: ['Book Curreri bus ahead in summer', 'SITA buses can be very crowded'],
    recommended: true,
    briketteUrl: toPrimeCanonicalRouteUrl('naples-airport-positano-bus'),
  },

  // === FROM NAPLES CENTRALE (TRAIN STATION) ===
  {
    slug: 'naples-center-train-bus',
    contentKey: 'naplesCenterTrainBus',
    title: 'Naples Centrale to Positano by Train + Bus',
    description: 'Train to Sorrento via Circumvesuviana, then SITA bus to Positano.',
    origin: 'Naples Centrale',
    originCategory: 'train-station',
    destination: 'Positano',
    primaryMode: 'train',
    modes: ['train', 'bus'],
    segments: [
      {
        mode: 'train',
        from: 'Naples Centrale',
        to: 'Sorrento',
        durationMinutes: 70,
        operator: 'Circumvesuviana (EAV)',
        notes: 'Departs from lower level, validate ticket before boarding',
      },
      {
        mode: 'bus',
        from: 'Sorrento',
        to: 'Positano (Chiesa Nuova)',
        durationMinutes: 60,
        operator: 'SITA Sud',
      },
    ],
    totalDurationMinutes: 130,
    costRange: { min: 12, max: 20 },
    warnings: ['Watch for pickpockets on Circumvesuviana'],
    recommended: true,
    briketteUrl: toPrimeCanonicalRouteUrl('naples-center-train-bus'),
  },
  {
    slug: 'naples-center-positano-ferry',
    contentKey: 'howToGetHereNaplesCenterPositanoFerry',
    title: 'Naples Port to Positano by Ferry',
    description: 'Scenic ferry from Naples Molo Beverello directly to Positano.',
    origin: 'Naples Port (Molo Beverello)',
    originCategory: 'port',
    destination: 'Positano',
    primaryMode: 'ferry',
    modes: ['ferry'],
    segments: [
      {
        mode: 'ferry',
        from: 'Naples (Molo Beverello)',
        to: 'Positano',
        durationMinutes: 85,
        operator: 'Various (Alilauro, SNAV)',
        notes: 'Seasonal service, check schedule',
      },
    ],
    totalDurationMinutes: 85,
    costRange: { min: 25, max: 40 },
    warnings: ['Ferries may be cancelled in rough weather', 'Limited winter service'],
    briketteUrl: toPrimeCanonicalRouteUrl('naples-center-positano-ferry'),
  },

  // === FROM SORRENTO ===
  {
    slug: 'sorrento-positano-bus',
    contentKey: 'sorrentoPositanoBus',
    title: 'Sorrento to Positano by Bus',
    description: 'Direct SITA bus along the scenic Amalfi Coast road.',
    origin: 'Sorrento',
    originCategory: 'city',
    destination: 'Positano',
    primaryMode: 'bus',
    modes: ['bus'],
    segments: [
      {
        mode: 'bus',
        from: 'Sorrento Bus Station',
        to: 'Positano (Chiesa Nuova)',
        durationMinutes: 60,
        operator: 'SITA Sud',
        notes: 'Departures every 30-60 minutes',
      },
    ],
    totalDurationMinutes: 60,
    costRange: { min: 3, max: 5 },
    warnings: ['Very crowded in peak season', 'Sit on right side for sea views'],
    recommended: true,
    briketteUrl: toPrimeCanonicalRouteUrl('sorrento-positano-bus'),
  },
  {
    slug: 'sorrento-positano-ferry',
    contentKey: 'sorrentoPositanoFerry',
    title: 'Sorrento to Positano by Ferry',
    description: 'Fast ferry avoiding traffic, with beautiful coastal views.',
    origin: 'Sorrento',
    originCategory: 'city',
    destination: 'Positano',
    primaryMode: 'ferry',
    modes: ['ferry'],
    segments: [
      {
        mode: 'ferry',
        from: 'Sorrento Marina',
        to: 'Positano (Spiaggia Grande)',
        durationMinutes: 35,
        operator: 'Positano Jet / Travelmar',
      },
    ],
    totalDurationMinutes: 35,
    costRange: { min: 18, max: 25 },
    warnings: ['Seasonal service (April-October)', 'Weather dependent'],
    briketteUrl: toPrimeCanonicalRouteUrl('sorrento-positano-ferry'),
  },

  // === FROM AMALFI ===
  {
    slug: 'amalfi-positano-bus',
    contentKey: 'howToGetHereAmalfiPositanoBus',
    title: 'Amalfi to Positano by Bus',
    description: 'SITA bus along the coast, about 30 minutes.',
    origin: 'Amalfi',
    originCategory: 'city',
    destination: 'Positano',
    primaryMode: 'bus',
    modes: ['bus'],
    segments: [
      {
        mode: 'bus',
        from: 'Amalfi',
        to: 'Positano (Chiesa Nuova)',
        durationMinutes: 30,
        operator: 'SITA Sud',
      },
    ],
    totalDurationMinutes: 30,
    costRange: { min: 3, max: 5 },
    briketteUrl: toPrimeCanonicalRouteUrl('amalfi-positano-bus'),
  },
  {
    slug: 'amalfi-positano-ferry',
    contentKey: 'howToGetHereAmalfiPositanoFerry',
    title: 'Amalfi to Positano by Ferry',
    description: 'Quick scenic ferry hop along the coast.',
    origin: 'Amalfi',
    originCategory: 'city',
    destination: 'Positano',
    primaryMode: 'ferry',
    modes: ['ferry'],
    segments: [
      {
        mode: 'ferry',
        from: 'Amalfi',
        to: 'Positano (Spiaggia Grande)',
        durationMinutes: 25,
        operator: 'Travelmar',
      },
    ],
    totalDurationMinutes: 25,
    costRange: { min: 12, max: 18 },
    warnings: ['Seasonal service'],
    briketteUrl: toPrimeCanonicalRouteUrl('amalfi-positano-ferry'),
  },

  // === FROM SALERNO ===
  {
    slug: 'salerno-positano-bus',
    contentKey: 'salernoPositanoBus',
    title: 'Salerno to Positano by Bus',
    description: 'SITA bus via Amalfi to Positano.',
    origin: 'Salerno Station',
    originCategory: 'train-station',
    destination: 'Positano',
    primaryMode: 'bus',
    modes: ['bus'],
    segments: [
      {
        mode: 'bus',
        from: 'Salerno Station',
        to: 'Positano (Chiesa Nuova)',
        durationMinutes: 90,
        operator: 'SITA Sud',
        notes: 'Via Amalfi',
      },
    ],
    totalDurationMinutes: 90,
    costRange: { min: 4, max: 8 },
    recommended: true,
    briketteUrl: toPrimeCanonicalRouteUrl('salerno-positano-bus'),
  },
  {
    slug: 'salerno-positano-ferry',
    contentKey: 'howToGetHereSalernoPositanoFerry',
    title: 'Salerno to Positano by Ferry',
    description: 'Ferry from Salerno port along the coast.',
    origin: 'Salerno Port',
    originCategory: 'port',
    destination: 'Positano',
    primaryMode: 'ferry',
    modes: ['ferry'],
    segments: [
      {
        mode: 'ferry',
        from: 'Salerno (Concordia)',
        to: 'Positano (Spiaggia Grande)',
        durationMinutes: 70,
        operator: 'Travelmar',
      },
    ],
    totalDurationMinutes: 70,
    costRange: { min: 15, max: 22 },
    warnings: ['Seasonal service'],
    briketteUrl: toPrimeCanonicalRouteUrl('salerno-positano-ferry'),
  },

  // === FROM CAPRI ===
  {
    slug: 'capri-positano-ferry',
    contentKey: 'capriPositanoFerry',
    title: 'Capri to Positano by Ferry',
    description: 'Ferry from Capri directly to Positano.',
    origin: 'Capri',
    originCategory: 'port',
    destination: 'Positano',
    primaryMode: 'ferry',
    modes: ['ferry'],
    segments: [
      {
        mode: 'ferry',
        from: 'Capri (Marina Grande)',
        to: 'Positano (Spiaggia Grande)',
        durationMinutes: 50,
        operator: 'Positano Jet',
      },
    ],
    totalDurationMinutes: 50,
    costRange: { min: 22, max: 30 },
    warnings: ['Limited departures', 'Seasonal service'],
    briketteUrl: toPrimeCanonicalRouteUrl('capri-positano-ferry'),
  },

  // === FROM RAVELLO ===
  {
    slug: 'ravello-positano-bus',
    contentKey: 'howToGetHereRavelloPositanoBus',
    title: 'Ravello to Positano by Bus',
    description: 'Bus from Ravello via Amalfi to Positano.',
    origin: 'Ravello',
    originCategory: 'city',
    destination: 'Positano',
    primaryMode: 'bus',
    modes: ['bus', 'bus'],
    segments: [
      {
        mode: 'bus',
        from: 'Ravello',
        to: 'Amalfi',
        durationMinutes: 25,
        operator: 'SITA Sud',
      },
      {
        mode: 'bus',
        from: 'Amalfi',
        to: 'Positano (Chiesa Nuova)',
        durationMinutes: 30,
        operator: 'SITA Sud',
      },
    ],
    totalDurationMinutes: 55,
    costRange: { min: 4, max: 8 },
    briketteUrl: toPrimeCanonicalRouteUrl('ravello-positano-bus'),
  },
];

/**
 * Get routes filtered by origin.
 */
export function getRoutesByOrigin(originId: string): Route[] {
  const origin = ROUTE_ORIGINS.find((o) => o.id === originId);
  if (!origin) return [];

  return ROUTES_TO_POSITANO.filter(
    (route) =>
      route.origin.toLowerCase().includes(origin.name.toLowerCase().split(' ')[0]) ||
      (originId === 'naples-airport' && route.slug.includes('naples-airport')) ||
      (originId === 'naples-centrale' && route.slug.includes('naples-center')) ||
      (originId === 'naples-port' && route.slug.includes('naples-center-positano-ferry')) ||
      (originId === 'salerno-station' && route.slug.includes('salerno') && !route.slug.includes('ferry')) ||
      (originId === 'salerno-port' && route.slug.includes('salerno') && route.slug.includes('ferry')),
  );
}

/**
 * Get routes filtered by transport mode.
 */
export function getRoutesByMode(mode: 'bus' | 'ferry' | 'train'): Route[] {
  return ROUTES_TO_POSITANO.filter((route) => route.primaryMode === mode);
}

/**
 * Get recommended routes.
 */
export function getRecommendedRoutes(): Route[] {
  return ROUTES_TO_POSITANO.filter((route) => route.recommended);
}

/**
 * Get a route by slug.
 */
export function getRouteBySlug(slug: string): Route | undefined {
  return ROUTES_TO_POSITANO.find((route) => route.slug === slug);
}
