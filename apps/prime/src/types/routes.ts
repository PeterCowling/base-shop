/**
 * Route types for pre-arrival route planning.
 *
 * Simplified route structure for Prime app.
 * Full route content is in Brikette; Prime shows summary cards.
 */

/**
 * Transport mode for a route segment.
 */
export type TransportMode = 'bus' | 'ferry' | 'train' | 'walk' | 'taxi';

/**
 * Origin location category.
 */
export type OriginCategory = 'airport' | 'train-station' | 'port' | 'city' | 'other';

/**
 * A route segment (e.g., one leg of a journey).
 */
export interface RouteSegment {
  /** Transport mode for this segment */
  mode: TransportMode;
  /** Origin name (e.g., "Naples Airport") */
  from: string;
  /** Destination name (e.g., "Sorrento") */
  to: string;
  /** Estimated duration in minutes */
  durationMinutes: number;
  /** Operator name (e.g., "Curreri Viaggi") */
  operator?: string;
  /** Notes about this segment */
  notes?: string;
}

/**
 * A complete route from origin to Positano.
 */
export interface Route {
  /** Unique route slug (matches Brikette) */
  slug: string;
  /** i18n content key for Brikette content */
  contentKey: string;
  /** Display title */
  title: string;
  /** Short description */
  description: string;
  /** Origin location name */
  origin: string;
  /** Origin category for grouping */
  originCategory: OriginCategory;
  /** Destination (always Positano for pre-arrival) */
  destination: string;
  /** Primary transport mode */
  primaryMode: TransportMode;
  /** All transport modes used */
  modes: TransportMode[];
  /** Route segments in order */
  segments: RouteSegment[];
  /** Total estimated duration in minutes */
  totalDurationMinutes: number;
  /** Estimated cost range in EUR */
  costRange?: { min: number; max: number };
  /** Important warnings (e.g., "Book ahead in summer") */
  warnings?: string[];
  /** Whether this route is recommended */
  recommended?: boolean;
  /** External link to full guide on Brikette */
  briketteUrl: string;
}

/**
 * Origin location for the route selector.
 */
export interface RouteOrigin {
  /** Unique ID */
  id: string;
  /** Display name */
  name: string;
  /** Category for grouping */
  category: OriginCategory;
  /** Icon name (for UI) */
  icon?: string;
}

/**
 * Props for route-related i18n keys.
 */
export const ROUTE_I18N_KEYS = {
  modes: {
    bus: 'routes.modes.bus',
    ferry: 'routes.modes.ferry',
    train: 'routes.modes.train',
    walk: 'routes.modes.walk',
    taxi: 'routes.modes.taxi',
  },
  categories: {
    airport: 'routes.categories.airport',
    'train-station': 'routes.categories.trainStation',
    port: 'routes.categories.port',
    city: 'routes.categories.city',
    other: 'routes.categories.other',
  },
} as const;
