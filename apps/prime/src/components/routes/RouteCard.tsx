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
      return 'bg-green-100 text-green-700';
    case 'ferry':
      return 'bg-blue-100 text-blue-700';
    case 'train':
      return 'bg-orange-100 text-orange-700';
    case 'walk':
      return 'bg-gray-100 text-gray-700';
    case 'taxi':
      return 'bg-yellow-100 text-yellow-700';
    default:
      return 'bg-gray-100 text-gray-700';
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
        w-full text-start rounded-xl border bg-white p-4
        transition-all duration-200
        hover:border-blue-300 hover:shadow-md
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
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
            <Star className="h-3 w-3" />
            {t('routes.recommended')}
          </span>
        )}
        {isSaved && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            {t('routes.savedRoute')}
          </span>
        )}
      </div>

      {/* Title and description */}
      <h3 className="mb-1 font-semibold text-gray-900">{route.title}</h3>
      <p className="mb-3 text-sm text-gray-600">{route.description}</p>

      {/* Duration and cost */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-gray-700">
          <Clock className="h-4 w-4 text-gray-400" />
          <span>{formatDuration(route.totalDurationMinutes)}</span>
        </div>
        {route.costRange && (
          <div className="text-gray-600">
            {route.costRange.min === route.costRange.max
              ? `€${route.costRange.min}`
              : `€${route.costRange.min}-${route.costRange.max}`}
          </div>
        )}
      </div>

      {/* Warnings */}
      {route.warnings && route.warnings.length > 0 && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <span>{route.warnings[0]}</span>
        </div>
      )}

      {/* Segments preview */}
      <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
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
