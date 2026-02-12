/**
 * RouteCard.tsx
 *
 * Card displaying a route option with transport mode, duration, and cost.
 */

import { type FC, memo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Anchor,
  ArrowRight,
  Bus,
  Clock,
  MapPin,
  Plane,
  Star,
  Train,
} from 'lucide-react';

import type { Route, TransportMode } from '../../types/routes';

interface RouteCardProps {
  /** Route to display */
  route: Route;
  /** Click handler */
  onClick?: () => void;
  /** Whether this route is saved */
  isSaved?: boolean;
  /** Optional class name */
  className?: string;
}

/**
 * Get icon for transport mode.
 */
function getModeIcon(mode: TransportMode): ReactNode {
  switch (mode) {
    case 'bus':
      return <Bus className="h-5 w-5" />;
    case 'ferry':
      return <Anchor className="h-5 w-5" />;
    case 'train':
      return <Train className="h-5 w-5" />;
    case 'walk':
      return <MapPin className="h-5 w-5" />;
    case 'taxi':
      return <Plane className="h-5 w-5" />;
    default:
      return <ArrowRight className="h-5 w-5" />;
  }
}

/**
 * Get background color for transport mode.
 */
function getModeColor(mode: TransportMode): string {
  switch (mode) {
    case 'bus':
      return 'bg-success-soft text-success-foreground';
    case 'ferry':
      return 'bg-info-soft text-info-foreground';
    case 'train':
      return 'bg-warning-soft text-warning-foreground';
    case 'walk':
      return 'bg-muted text-foreground';
    case 'taxi':
      return 'bg-accent-soft text-accent';
    default:
      return 'bg-muted text-foreground';
  }
}

/**
 * Format duration in hours and minutes.
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export const RouteCard: FC<RouteCardProps> = memo(function RouteCard({
  route,
  onClick,
  isSaved,
  className = '',
}) {
  const { t } = useTranslation('PreArrival');

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-start rounded-xl border bg-card p-4
        transition-all duration-200
        hover:border-primary/30 hover:shadow-md
        ${className}
      `}
    >
      {/* Header with mode badges */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {route.modes.map((mode, idx) => (
            <span
              key={`${mode}-${idx}`}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${getModeColor(mode)}`}
            >
              {getModeIcon(mode)}
              <span className="capitalize">{mode}</span>
            </span>
          ))}
        </div>
        {route.recommended && (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-1 text-xs font-medium text-warning-foreground">
            <Star className="h-3 w-3" />
            {t('routes.recommended')}
          </span>
        )}
        {isSaved && (
          <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-1 text-xs font-medium text-success-foreground">
            {t('routes.savedRoute')}
          </span>
        )}
      </div>

      {/* Title and description */}
      <h3 className="mb-1 font-semibold text-foreground">{route.title}</h3>
      <p className="mb-3 text-sm text-muted-foreground">{route.description}</p>

      {/* Duration and cost */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-foreground">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{formatDuration(route.totalDurationMinutes)}</span>
        </div>
        {route.costRange && (
          <div className="text-muted-foreground">
            {route.costRange.min === route.costRange.max
              ? `€${route.costRange.min}`
              : `€${route.costRange.min}-${route.costRange.max}`}
          </div>
        )}
      </div>

      {/* Warnings */}
      {route.warnings && route.warnings.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-warning-soft p-2 text-sm text-warning-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
          <span>{route.warnings[0]}</span>
        </div>
      )}

      {/* Segments preview */}
      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        {route.segments.map((segment, idx) => (
          <span key={idx} className="flex items-center gap-1">
            {idx > 0 && <ArrowRight className="h-3 w-3" />}
            <span>{segment.from.split('(')[0].trim()}</span>
          </span>
        ))}
        <ArrowRight className="h-3 w-3" />
        <span>{route.destination}</span>
      </div>
    </button>
  );
});

export default RouteCard;
