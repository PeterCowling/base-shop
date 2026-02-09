import { type FC,memo } from 'react';

import { StaffSignalBadgeGroup } from '@acme/ui';

import type { StaffPersonalizationSignals, StaffReadinessSignals } from '../../types/checkInCode';

interface StaffReadinessBadgesProps {
  readiness: StaffReadinessSignals;
  personalization?: StaffPersonalizationSignals;
  operational?: {
    bagDropRequested: boolean;
  };
  className?: string;
}

interface ReadinessBadgeConfig {
  key: keyof Omit<StaffReadinessSignals, 'readinessScore'>;
  label: string;
}

const BADGE_CONFIG: ReadinessBadgeConfig[] = [
  { key: 'etaConfirmed', label: 'ETA shared' },
  { key: 'cashPrepared', label: 'Cash prepared' },
  { key: 'routePlanned', label: 'Route planned' },
  { key: 'rulesReviewed', label: 'Rules reviewed' },
  { key: 'locationSaved', label: 'Location saved' },
];

export const StaffReadinessBadges: FC<StaffReadinessBadgesProps> = memo(function StaffReadinessBadges({
  readiness,
  personalization,
  operational,
  className = '',
}) {
  const signals = BADGE_CONFIG.map((badge) => ({
    id: badge.key,
    label: badge.label,
    ready: readiness[badge.key] === true,
  }));

  return (
    <section className={`rounded-xl bg-slate-50 p-4 ${className}`} aria-label="staff-readiness">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Arrival readiness
        </h3>
        <span className="rounded-full bg-slate-200 px-2 py-1 text-xs font-semibold text-slate-700">
          {readiness.readinessScore}%
        </span>
      </div>

      <StaffSignalBadgeGroup title="Signals" signals={signals} />

      {(personalization?.arrivalMethodPreference || personalization?.arrivalConfidence) && (
        <p className="mt-3 text-xs text-slate-700">
          Context:
          {personalization.arrivalMethodPreference && ` method ${personalization.arrivalMethodPreference}`}
          {personalization.arrivalConfidence && `, confidence ${personalization.arrivalConfidence}`}
        </p>
      )}

      {operational?.bagDropRequested && (
        <p className="mt-2 text-xs font-medium text-amber-700">
          Post-checkout bag-drop request is active.
        </p>
      )}
    </section>
  );
});

export default StaffReadinessBadges;
