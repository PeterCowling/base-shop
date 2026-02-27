'use client';

import { useMemo } from 'react';

import {
  aggregateActivationFunnel,
  readActivationFunnelEvents,
} from '../../lib/analytics/activationFunnel';

export default function ActivationFunnelSummary() {
  const summary = useMemo(() => {
    const events = readActivationFunnelEvents();
    return aggregateActivationFunnel(events, {
      activationStart: 'lookup_success',
      readinessComplete: 'guided_step_complete',
    });
  }, []);

  return (
    <section className="space-y-3 rounded-xl bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Activation funnel</h2>
      <p className="text-sm text-muted-foreground">
        Conversion from booking lookup through readiness completion.
      </p>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Metric label="Lookup success" value={summary.counts.lookup_success} />
        <Metric label="Verify success" value={summary.counts.verify_success} />
        <Metric
          label="Readiness complete"
          value={summary.counts.guided_step_complete}
        />
        <Metric
          label="Arrival mode entered"
          value={summary.counts.arrival_mode_entered}
        />
        <Metric
          label="Utility actions used"
          value={summary.counts.utility_action_used}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs text-foreground">
        <Ratio
          label="Lookup → Verify"
          value={summary.conversion.lookupToVerify}
        />
        <Ratio
          label="Verify → Readiness"
          value={summary.conversion.verifyToReadiness}
        />
        <Ratio
          label="Lookup → Readiness"
          value={summary.conversion.lookupToReadiness}
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Weekly trend</h3>
        {summary.trends.weekly.length === 0 ? (
          <p className="text-sm text-muted-foreground">No funnel events captured yet.</p>
        ) : (
          <div className="space-y-1 text-sm">
            {summary.trends.weekly.map((point) => (
              <div
                key={point.weekStartIso}
                className="flex items-center justify-between rounded-md bg-muted px-3 py-2"
              >
                <span className="font-medium text-foreground">{point.weekStartIso}</span>
                <span className="text-muted-foreground">
                  {point.readinessSessions}/{point.lookupSessions} ready (
                  {Math.round(point.activationConversion * 100)}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Ratio({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-info-soft px-3 py-2">
      <div className="text-xs text-info-foreground">{label}</div>
      <div className="text-sm font-semibold text-info-foreground">
        {Math.round(value * 100)}%
      </div>
    </div>
  );
}
