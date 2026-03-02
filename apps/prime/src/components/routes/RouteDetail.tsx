/**
 * RouteDetail.tsx
 *
 * Detailed view of a route with segments, times, and actions.
 */

'use client';

import { type FC, memo, type ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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

// i18n-exempt -- PRIME-ROUTES-001 [ttl=2026-12-31] Non-UI window open target/features.
const BRIKETTE_WINDOW_TARGET = '_blank';
// eslint-disable-next-line ds/no-hardcoded-copy -- BRIK-3 non-UI window.open features.
const BRIKETTE_WINDOW_FEATURES = 'noopener,noreferrer';

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
      return 'bg-success';
    case 'ferry':
      return 'bg-info';
    case 'train':
      return 'bg-warning';
    case 'walk':
      return 'bg-muted-foreground';
    case 'taxi':
      return 'bg-accent';
    default:
      return 'bg-muted-foreground';
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
    window.open(route.briketteUrl, BRIKETTE_WINDOW_TARGET, BRIKETTE_WINDOW_FEATURES);
  }, [route.briketteUrl]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mt-1 min-h-11 min-w-11 rounded-full p-2 hover:bg-muted"
            aria-label={t('routes.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">{route.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{route.description}</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="flex items-center gap-4 rounded-xl bg-muted p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm text-muted-foreground">{t('routes.totalTime')}</p>
            <p className="font-semibold text-foreground">
              {formatDuration(route.totalDurationMinutes)}
            </p>
          </div>
        </div>
        {route.costRange && (
          <div className="border-s ps-4">
            <p className="text-sm text-muted-foreground">{t('routes.cost')}</p>
            <p className="font-semibold text-foreground">
              {route.costRange.min === route.costRange.max
                ? `€${route.costRange.min}`
                : `€${route.costRange.min} - €${route.costRange.max}`}
            </p>
          </div>
        )}
      </div>

      {/* Warnings */}
      {route.warnings && route.warnings.length > 0 && (
        <div className="rounded-xl bg-warning-soft p-4">
          <div className="mb-2 flex items-center gap-2 font-medium text-warning-foreground">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <span>{t('routes.importantNotes')}</span>
          </div>
          <ul className="list-inside list-disc space-y-1 text-sm text-warning-foreground">
            {route.warnings.map((warning, idx) => (
              <li key={idx}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Segments timeline */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-4 font-semibold text-foreground">{t('routes.journey')}</h3>
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-success-foreground">
              <MapPin className="h-4 w-4" />
            </div>
            <div className="pt-1">
              <p className="font-medium text-foreground">{route.destination}</p>
              <p className="text-sm text-success">{t('routes.arrival')}</p>
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
                ? 'bg-success-soft text-success-foreground'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
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
          // eslint-disable-next-line ds/min-tap-size -- BRIK-3 text+padding control exceeds mobile tap target.
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-medium text-foreground transition-colors hover:bg-muted"
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
  const { t: _t } = useTranslation('PreArrival');

  return (
    <div className="relative mb-6 flex items-start gap-3">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute start-4 top-8 h-full w-0.5 -translate-x-1/2 bg-border" />
      )}

      {/* Mode icon */}
      <div
        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-success-foreground ${getModeColor(segment.mode)}`}
      >
        {getModeIcon(segment.mode)}
      </div>

      {/* Segment details */}
      <div className="flex-1 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-foreground">{segment.from}</p>
            <p className="text-sm text-muted-foreground">
              {segment.operator && <span>{segment.operator}</span>}
            </p>
          </div>
          <div className="text-end">
            <p className="text-sm font-medium text-foreground">
              {formatDuration(segment.durationMinutes)}
            </p>
          </div>
        </div>
        {segment.notes && (
          <p className="mt-1 text-sm text-muted-foreground">{segment.notes}</p>
        )}

        {/* Arrow to next */}
        <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowRight className="h-4 w-4" />
          <span>{segment.to}</span>
        </div>
      </div>
    </div>
  );
});

export default RouteDetail;
