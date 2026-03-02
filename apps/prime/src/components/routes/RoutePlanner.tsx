/**
 * RoutePlanner.tsx
 *
 * Main route planning component with origin selector and route list.
 */

'use client';

import { type FC, memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Anchor,
  ArrowLeft,
  ChevronRight,
  MapPin,
  Plane,
  Train,
} from 'lucide-react';

import { useRoutes } from '../../hooks/useRoutes';
import type { Route, RouteOrigin, TransportMode } from '../../types/routes';

import RouteCard from './RouteCard';
import RouteDetail from './RouteDetail';

interface RoutePlannerProps {
  /** Currently saved route slug */
  savedRouteSlug?: string | null;
  /** Handler when a route is saved */
  onSaveRoute?: (slug: string | null) => void;
  /** Handler when route is viewed (marks checklist item) */
  onRouteViewed?: () => void;
  /** Handler to close the planner */
  onClose?: () => void;
}

/**
 * Get icon for origin category.
 */
function getOriginIcon(icon?: string) {
  switch (icon) {
    case 'plane':
      return <Plane className="h-5 w-5" />;
    case 'train':
      return <Train className="h-5 w-5" />;
    case 'anchor':
      return <Anchor className="h-5 w-5" />;
    default:
      return <MapPin className="h-5 w-5" />;
  }
}

/**
 * Mode filter options.
 */
const MODE_FILTERS: { mode: TransportMode | 'all'; labelKey: string }[] = [
  { mode: 'all', labelKey: 'routes.filters.all' },
  { mode: 'bus', labelKey: 'routes.filters.bus' },
  { mode: 'ferry', labelKey: 'routes.filters.ferry' },
  { mode: 'train', labelKey: 'routes.filters.train' },
];

export const RoutePlanner: FC<RoutePlannerProps> = memo(function RoutePlanner({
  savedRouteSlug,
  onSaveRoute,
  onRouteViewed,
  onClose,
}) {
  const { t } = useTranslation('PreArrival');
  const { origins, routes, originsByCategory, getRoute: _getRoute } = useRoutes();

  // State
  const [selectedOriginId, setSelectedOriginId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<TransportMode | 'all'>('all');
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // Get selected origin details
  const selectedOrigin = useMemo(() => {
    if (!selectedOriginId) return null;
    return origins.find((o) => o.id === selectedOriginId) || null;
  }, [selectedOriginId, origins]);

  // Filter routes by origin and mode
  const filteredRoutes = useMemo(() => {
    let filtered = routes;

    if (selectedOriginId) {
      filtered = filtered.filter((route) => {
        const origin = origins.find((o) => o.id === selectedOriginId);
        if (!origin) return false;

        // Match by origin name or category
        const originName = origin.name.toLowerCase();
        const routeOrigin = route.origin.toLowerCase();

        return (
          routeOrigin.includes(originName.split(' ')[0]) ||
          routeOrigin.includes(originName.split('(')[0].trim())
        );
      });
    }

    if (selectedMode !== 'all') {
      filtered = filtered.filter((route) => route.primaryMode === selectedMode);
    }

    return filtered;
  }, [routes, selectedOriginId, selectedMode, origins]);

  // Handle origin selection
  const handleOriginSelect = useCallback((originId: string) => {
    setSelectedOriginId(originId);
  }, []);

  // Handle route selection
  const handleRouteSelect = useCallback(
    (route: Route) => {
      setSelectedRoute(route);
      onRouteViewed?.();
    },
    [onRouteViewed],
  );

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (selectedRoute) {
      setSelectedRoute(null);
    } else if (selectedOriginId) {
      setSelectedOriginId(null);
    } else {
      onClose?.();
    }
  }, [selectedRoute, selectedOriginId, onClose]);

  // Handle save route
  const handleSaveRoute = useCallback(
    (slug: string) => {
      onSaveRoute?.(slug);
    },
    [onSaveRoute],
  );

  // Render route detail view
  if (selectedRoute) {
    return (
      <RouteDetail
        route={selectedRoute}
        isSaved={savedRouteSlug === selectedRoute.slug}
        onSave={() => handleSaveRoute(selectedRoute.slug)}
        onBack={handleBack}
      />
    );
  }

  // Render route list when origin is selected
  if (selectedOriginId && selectedOrigin) {
    return (
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="min-h-11 min-w-11 rounded-full p-2 hover:bg-muted"
            aria-label={t('routes.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-semibold">{t('routes.fromOrigin', { origin: selectedOrigin.name })}</h2>
            <p className="text-sm text-muted-foreground">{t('routes.selectRoute')}</p>
          </div>
        </div>

        {/* Mode filter */}
        <div className="space-x-2 overflow-x-auto whitespace-nowrap pb-2">
          {MODE_FILTERS.map((filter) => (
            <button
              key={filter.mode}
              type="button"
              onClick={() => setSelectedMode(filter.mode)}
              className={`
                inline-block rounded-full px-4 py-2 text-sm font-medium
                transition-colors
                ${
                  selectedMode === filter.mode
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground hover:bg-muted/80'
                }
              `}
            >
              {t(filter.labelKey)}
            </button>
          ))}
        </div>

        {/* Route list */}
        <div className="space-y-3">
          {filteredRoutes.length > 0 ? (
            filteredRoutes.map((route) => (
              <RouteCard
                key={route.slug}
                route={route}
                onClick={() => handleRouteSelect(route)}
                isSaved={savedRouteSlug === route.slug}
              />
            ))
          ) : (
            <div className="rounded-xl bg-muted p-6 text-center text-muted-foreground">
              {t('routes.noRoutes')}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render origin selector
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 rounded-full p-2 hover:bg-muted"
            aria-label={t('routes.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h2 className="text-lg font-semibold">{t('routes.title')}</h2>
          <p className="text-sm text-muted-foreground">{t('routes.subtitle')}</p>
        </div>
      </div>

      {/* Origin categories */}
      {Object.entries(originsByCategory).map(([category, categoryOrigins]) => (
        <div key={category}>
          <h3 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {t(`routes.categories.${category}`)}
          </h3>
          <div className="space-y-2">
            {categoryOrigins.map((origin) => (
              <OriginButton
                key={origin.id}
                origin={origin}
                onClick={() => handleOriginSelect(origin.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

/**
 * Origin selection button.
 */
const OriginButton: FC<{
  origin: RouteOrigin;
  onClick: () => void;
}> = memo(function OriginButton({ origin, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      // eslint-disable-next-line ds/min-tap-size -- BRIK-3 full-row control exceeds mobile tap target.
      className="h-11 w-full rounded-xl border bg-card p-4 text-start transition-all hover:border-primary/30 hover:shadow-sm"
    >
      <div className="inline-block">
        <div className="inline-block h-10 w-10 rounded-full bg-muted text-center align-middle text-muted-foreground">
          {getOriginIcon(origin.icon)}
        </div>
        <span className="ms-3 align-middle font-medium text-foreground">{origin.name}</span>
      </div>
      <ChevronRight className="float-end h-5 w-5 text-muted-foreground" />
    </button>
  );
});

export default RoutePlanner;
