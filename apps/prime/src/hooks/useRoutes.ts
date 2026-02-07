/**
 * useRoutes
 *
 * Hook for accessing route data in the pre-arrival flow.
 */

import { useMemo } from 'react';
import {
  getRecommendedRoutes,
  getRouteBySlug,
  getRoutesByMode,
  getRoutesByOrigin,
  ROUTE_ORIGINS,
  ROUTES_TO_POSITANO,
} from '../data/routes';
import type { Route, RouteOrigin, TransportMode } from '../types/routes';

export interface UseRoutesOptions {
  /** Filter by origin ID */
  originId?: string;
  /** Filter by transport mode */
  mode?: TransportMode;
  /** Only show recommended routes */
  recommendedOnly?: boolean;
}

export interface UseRoutesReturn {
  /** All available routes (filtered if options provided) */
  routes: Route[];
  /** All origin locations */
  origins: RouteOrigin[];
  /** Get a route by slug */
  getRoute: (slug: string) => Route | undefined;
  /** Get recommended routes */
  recommended: Route[];
  /** Origins grouped by category */
  originsByCategory: Record<string, RouteOrigin[]>;
}

/**
 * Hook for accessing route data.
 */
export function useRoutes(options: UseRoutesOptions = {}): UseRoutesReturn {
  const { originId, mode, recommendedOnly } = options;

  // Filter routes based on options
  const routes = useMemo(() => {
    let filtered = [...ROUTES_TO_POSITANO];

    if (originId) {
      filtered = getRoutesByOrigin(originId);
    }

    if (mode) {
      filtered = filtered.filter((route) => route.primaryMode === mode);
    }

    if (recommendedOnly) {
      filtered = filtered.filter((route) => route.recommended);
    }

    return filtered;
  }, [originId, mode, recommendedOnly]);

  // Group origins by category
  const originsByCategory = useMemo(() => {
    const grouped: Record<string, RouteOrigin[]> = {};
    for (const origin of ROUTE_ORIGINS) {
      if (!grouped[origin.category]) {
        grouped[origin.category] = [];
      }
      grouped[origin.category].push(origin);
    }
    return grouped;
  }, []);

  // Get recommended routes
  const recommended = useMemo(() => getRecommendedRoutes(), []);

  return {
    routes,
    origins: ROUTE_ORIGINS,
    getRoute: getRouteBySlug,
    recommended,
    originsByCategory,
  };
}
