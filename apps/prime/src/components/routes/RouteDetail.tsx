/**
 * RouteDetail.tsx
 *
 * Detailed view of a route with segments, times, and actions.
 */

import {
  AlertTriangle,
  Anchor,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Bus,
  Clock,
  ExternalLink,
  MapPin,
  Train,
} from 'lucide-react';
import { FC, memo, ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Route, RouteSegment, TransportMode } from '../../types/routes';

interface RouteDetailProps {
  /** Route to display */
  route: Route;
  /** Whether this route is saved */
  isSaved?: boolean;
  /** Handler to save the route */
  onSave?: () => void;
  /** Handler to go back */
  onBack?: () => void;
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
      return 'bg-green-500';
    case 'ferry':
      return 'bg-blue-500';
    case 'train':
      return 'bg-orange-500';
    case 'walk':
      return 'bg-gray-500';
    case 'taxi':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}

/**
 * Format duration in hours and minutes.
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

export const RouteDetail: FC<RouteDetailProps> = memo(function RouteDetail({
  route,
  isSaved,
  onSave,
  onBack,
}) {
  const { t } = useTranslation('PreArrival');

  // Open route in Brikette
  const handleOpenBrikette = useCallback(() => {
    window.open(route.briketteUrl, '_blank', 'noopener,noreferrer');
  }, [route.briketteUrl]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-1 rounded-full p-2 hover:bg-gray-100"
            aria-label={t('routes.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900">{route.title}</h2>
          <p className="mt-1 text-sm text-gray-600">{route.description}</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-500">{t('routes.totalTime')}</p>
            <p className="font-semibold text-gray-900">
              {formatDuration(route.totalDurationMinutes)}
            </p>
          </div>
        </div>
        {route.costRange && (
          <div className="border-s ps-4">
            <p className="text-sm text-gray-500">{t('routes.cost')}</p>
            <p className="font-semibold text-gray-900">
              {route.costRange.min === route.costRange.max
                ? `€${route.costRange.min}`
                : `€${route.costRange.min} - €${route.costRange.max}`}
            </p>
          </div>
        )}
      </div>

      {/* Warnings */}
      {route.warnings && route.warnings.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-4">
          <div className="mb-2 flex items-center gap-2 font-medium text-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <span>{t('routes.importantNotes')}</span>
          </div>
          <ul className="list-inside list-disc space-y-1 text-sm text-amber-800">
            {route.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Segments timeline */}
      <div className="rounded-xl border bg-white p-4">
        <h3 className="mb-4 font-semibold text-gray-900">{t('routes.journey')}</h3>
        <div className="relative">
          {route.segments.map((segment, idx) => (
            <SegmentItem
              key={idx}
              segment={segment}
              isLast={idx === route.segments.length - 1}
            />
          ))}

          {/* Final destination */}
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="pt-1">
              <p className="font-medium text-gray-900">{route.destination}</p>
              <p className="text-sm text-green-600">{t('routes.arrival')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {/* Save route button */}
        <button
          type="button"
          onClick={onSave}
          className={`
            flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-medium
            transition-colors
            ${
              isSaved
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          {isSaved ? (
            <>
              <BookmarkCheck className="h-5 w-5" />
              {t('routes.routeSaved')}
            </>
          ) : (
            <>
              <Bookmark className="h-5 w-5" />
              {t('routes.saveRoute')}
            </>
          )}
        </button>

        {/* View full guide on Brikette */}
        <button
          type="button"
          onClick={handleOpenBrikette}
          className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <ExternalLink className="h-5 w-5" />
          {t('routes.viewFullGuide')}
        </button>
      </div>
    </div>
  );
});

/**
 * Single segment in the timeline.
 */
const SegmentItem: FC<{
  segment: RouteSegment;
  isLast: boolean;
}> = memo(function SegmentItem({ segment, isLast }) {
  const { t } = useTranslation('PreArrival');

  return (
    <div className="relative mb-6 flex items-start gap-3">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute start-4 top-8 h-full w-0.5 -translate-x-1/2 bg-gray-200" />
      )}

      {/* Mode icon */}
      <div
        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-white ${getModeColor(segment.mode)}`}
      >
        {getModeIcon(segment.mode)}
      </div>

      {/* Segment details */}
      <div className="flex-1 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-gray-900">{segment.from}</p>
            <p className="text-sm text-gray-500">
              {segment.operator && <span>{segment.operator}</span>}
            </p>
          </div>
          <div className="text-end">
            <p className="text-sm font-medium text-gray-700">
              {formatDuration(segment.durationMinutes)}
            </p>
          </div>
        </div>
        {segment.notes && (
          <p className="mt-1 text-sm text-gray-500">{segment.notes}</p>
        )}

        {/* Arrow to next */}
        <div className="mt-2 flex items-center gap-1 text-sm text-gray-400">
          <ArrowRight className="h-4 w-4" />
          <span>{segment.to}</span>
        </div>
      </div>
    </div>
  );
});

export default RouteDetail;
