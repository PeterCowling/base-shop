'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';

import { usePinAuth } from '../../contexts/messaging/PinAuthProvider';
import { isStaffRole } from '../../lib/checkin/helpers';

const DEFAULT_WINDOW_DAYS = 7;
const WINDOW_OPTIONS = [7, 14, 30] as const;
const MAX_API_WINDOW_DAYS = 30;

interface DirectTelemetryPayload {
  generatedAt: string;
  windowDays: number;
  dayBuckets?: string[];
  totals: Record<string, number>;
  byDay?: Record<string, Record<string, number>>;
}

type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

interface MetricDefinition {
  key: string;
  label: string;
}

const METRICS: MetricDefinition[] = [
  { key: 'write.success', label: 'Messages delivered' },
  { key: 'write.denied_not_confirmed_guests', label: 'Blocked: non-confirmed guests' },
  { key: 'write.rate_limited', label: 'Write rate limited' },
  { key: 'read.success', label: 'Inbox reads' },
  { key: 'read.rate_limited', label: 'Read rate limited' },
];

const COMPARISON_METRICS: MetricDefinition[] = [
  { key: 'write.success', label: 'Messages delivered' },
  { key: 'write.denied_not_confirmed_guests', label: 'Blocked non-confirmed guests' },
  { key: 'write.rate_limited', label: 'Write rate limited' },
  { key: 'read.success', label: 'Inbox reads' },
];

function sumMetricForDays(
  byDay: Record<string, Record<string, number>>,
  days: string[],
  key: string,
): number {
  return days.reduce((sum, day) => sum + getMetricTotal(byDay[day] ?? {}, key), 0);
}

function getMetricTotal(totals: Record<string, number>, key: string): number {
  const value = totals[key];
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function calculateWriteAttemptTotal(totals: Record<string, number>): number {
  return Object.entries(totals)
    .filter(([key]) => key.startsWith('write.'))
    .reduce((sum, [, value]) => sum + (Number.isFinite(value) && value > 0 ? value : 0), 0);
}

export default function DirectTelemetryPanel() {
  const { authToken, role, user } = usePinAuth();
  const [windowDays, setWindowDays] = useState<number>(DEFAULT_WINDOW_DAYS);
  const [status, setStatus] = useState<LoadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<DirectTelemetryPayload | null>(null);

  const hasStaffAccess = isStaffRole(role);
  const comparisonWindowDays = Math.min(windowDays * 2, MAX_API_WINDOW_DAYS);
  const canCompare = comparisonWindowDays === windowDays * 2;

  const loadTelemetry = useCallback(async () => {
    if (!authToken || !hasStaffAccess) {
      setPayload(null);
      setStatus('idle');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const response = await fetch(`/api/direct-telemetry?days=${comparisonWindowDays}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('Staff authentication expired. Please sign in again.');
        } else {
          setError('Unable to load direct-message telemetry right now.');
        }
        setStatus('error');
        return;
      }

      const nextPayload = await response.json() as DirectTelemetryPayload;
      setPayload(nextPayload);
      setStatus('success');
    } catch {
      setError('Unable to load direct-message telemetry right now.');
      setStatus('error');
    }
  }, [authToken, comparisonWindowDays, hasStaffAccess]);

  useEffect(() => {
    void loadTelemetry();
  }, [loadTelemetry]);

  const currentBuckets = useMemo(() => {
    const dayBuckets = payload?.dayBuckets ?? [];
    return dayBuckets.slice(-windowDays);
  }, [payload?.dayBuckets, windowDays]);

  const previousBuckets = useMemo(() => {
    if (!canCompare) {
      return [];
    }
    const dayBuckets = payload?.dayBuckets ?? [];
    return dayBuckets.slice(-(windowDays * 2), -windowDays);
  }, [canCompare, payload?.dayBuckets, windowDays]);

  const currentTotals = useMemo(() => {
    const byDay = payload?.byDay ?? {};
    return Object.fromEntries(
      METRICS.map((metric) => [metric.key, sumMetricForDays(byDay, currentBuckets, metric.key)]),
    );
  }, [currentBuckets, payload?.byDay]);

  const writeAttempts = useMemo(() => {
    const byDay = payload?.byDay ?? {};
    return currentBuckets.reduce((sum, day) => {
      const dayTotals = byDay[day] ?? {};
      return sum + calculateWriteAttemptTotal(dayTotals);
    }, 0);
  }, [currentBuckets, payload?.byDay]);

  const blockedNotConfirmed = useMemo(
    () => getMetricTotal(currentTotals, 'write.denied_not_confirmed_guests'),
    [currentTotals],
  );

  const blockedRate = writeAttempts > 0
    ? Math.round((blockedNotConfirmed / writeAttempts) * 100)
    : 0;
  const trendPoints = useMemo(() => {
    const buckets = currentBuckets;
    const byDay = payload?.byDay ?? {};
    if (buckets.length < 2) {
      return '';
    }
    const values = buckets.map((day) => getMetricTotal(byDay[day] ?? {}, 'write.success'));
    const max = Math.max(...values, 1);
    const width = 220;
    const height = 52;
    const xStep = width / (values.length - 1);
    return values
      .map((value, index) => {
        const x = Math.round(index * xStep);
        const y = Math.round(height - (value / max) * height);
        return `${x},${y}`;
      })
      .join(' ');
  }, [currentBuckets, payload?.byDay]);

  const comparisonBadges = useMemo(() => {
    if (!canCompare || previousBuckets.length === 0 || currentBuckets.length === 0) {
      return [];
    }
    const byDay = payload?.byDay ?? {};

    return COMPARISON_METRICS.map((metric) => {
      const current = sumMetricForDays(byDay, currentBuckets, metric.key);
      const previous = sumMetricForDays(byDay, previousBuckets, metric.key);
      const delta = current - previous;
      const deltaPct = previous > 0
        ? Math.round((delta / previous) * 100)
        : (current > 0 ? 100 : 0);

      let direction: 'up' | 'down' | 'flat' = 'flat';
      if (deltaPct >= 10) {
        direction = 'up';
      } else if (deltaPct <= -10) {
        direction = 'down';
      }

      const isRateLimitMetric = metric.key === 'write.rate_limited';
      const isBlockedMetric = metric.key === 'write.denied_not_confirmed_guests';
      const isSuccessMetric = metric.key === 'write.success' || metric.key === 'read.success';
      const isWarning = (
        (isRateLimitMetric && direction === 'up' && deltaPct >= 20)
        || (isBlockedMetric && direction === 'up' && deltaPct >= 15)
        || (isSuccessMetric && direction === 'down' && deltaPct <= -20)
      );

      return {
        key: metric.key,
        label: metric.label,
        current,
        previous,
        deltaPct,
        direction,
        isWarning,
      };
    });
  }, [canCompare, currentBuckets, payload?.byDay, previousBuckets]);

  return (
    <section className="mt-6 rounded-xl bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Direct Message Telemetry</h2>
          <p className="text-sm text-muted-foreground">
            Staff-gated telemetry window
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void loadTelemetry();
          }}
          disabled={status === 'loading' || !authToken || !hasStaffAccess}
          className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>
      <div className="mb-4 space-x-2">
        {WINDOW_OPTIONS.map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => {
              setWindowDays(days);
            }}
            disabled={status === 'loading' || !authToken || !hasStaffAccess}
            className={`rounded-lg px-3 py-2 text-sm ${
              windowDays === days
                ? 'bg-primary text-primary-foreground'
                : 'border border-border text-foreground hover:bg-muted'
            }`}
          >
            {days}d
          </button>
        ))}
      </div>

      {(!user || !authToken || !hasStaffAccess) && (
        <div className="rounded-lg bg-warning-soft p-4">
          <p className="text-sm text-warning-foreground">
            Staff sign-in is required to view telemetry totals.
          </p>
        </div>
      )}

      {status === 'loading' && authToken && hasStaffAccess && (
        <p className="text-sm text-muted-foreground">Loading telemetry...</p>
      )}

      {status === 'error' && error && authToken && hasStaffAccess && (
        <div className="rounded-lg bg-danger-soft p-4">
          <p className="text-sm text-danger-foreground">{error}</p>
        </div>
      )}

      {status === 'success' && payload && authToken && hasStaffAccess && (
        <>
          <div className="space-y-2">
            {METRICS.map((metric) => (
              <div key={metric.key} className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className="mt-1 text-xl font-semibold text-foreground">
                  {getMetricTotal(currentTotals, metric.key)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-border p-3">
            <p className="text-xs text-muted-foreground">Compared with previous window</p>
            {comparisonBadges.length === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                Previous-window baseline unavailable for {windowDays}d view.
              </p>
            )}
            <div className="mt-2 space-y-2">
              {comparisonBadges.map((badge) => (
                <div
                  key={badge.key}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    badge.isWarning ? 'bg-warning-soft text-warning-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span className="font-medium text-foreground">{badge.label}</span>{' '}
                  {badge.direction === 'up' ? 'up' : badge.direction === 'down' ? 'down' : 'flat'}{' '}
                  ({badge.deltaPct >= 0 ? `+${badge.deltaPct}` : badge.deltaPct}%): {badge.current} vs {badge.previous}
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-lg bg-muted px-3 py-2">
              <p className="text-xs font-medium text-foreground">Badge thresholds</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                <li>Write rate limited up 20% or more.</li>
                <li>Blocked non-confirmed guests up 15% or more.</li>
                <li>Messages delivered or inbox reads down 20% or more.</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-border p-3">
            <p className="text-sm text-muted-foreground">
              Non-confirmed guest block rate:{' '}
              <span className="font-semibold text-foreground">{blockedRate}%</span>{' '}
              ({blockedNotConfirmed}/{writeAttempts} write attempts)
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Updated {new Date(payload.generatedAt).toLocaleString()}
            </p>
          </div>
          {trendPoints && (
            <div className="mt-4 rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Write success trend</p>
              <svg
                viewBox="0 0 220 52"
                role="img"
                aria-label="Write success trend sparkline"
                className="mt-2 h-14 w-full"
              >
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  points={trendPoints}
                  className="text-primary"
                />
              </svg>
            </div>
          )}
        </>
      )}
    </section>
  );
}
