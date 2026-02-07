import { memo, type FC } from 'react';
import type { StaffPersonalizationSignals, StaffReadinessSignals } from '../../types/checkInCode';

interface StaffReadinessBadgesProps {
  readiness: StaffReadinessSignals;
  personalization?: StaffPersonalizationSignals;
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

function getBadgeClass(isComplete: boolean): string {
  if (isComplete) {
    return 'border-green-200 bg-green-100 text-green-800';
  }

  return 'border-amber-200 bg-amber-100 text-amber-800';
}

export const StaffReadinessBadges: FC<StaffReadinessBadgesProps> = memo(function StaffReadinessBadges({
  readiness,
  personalization,
  className = '',
}) {
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

      <div className="flex flex-wrap gap-2">
        {BADGE_CONFIG.map((badge) => {
          const complete = readiness[badge.key] === true;
          return (
            <span
              key={badge.key}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getBadgeClass(complete)}`}
            >
              {badge.label}: {complete ? 'Ready' : 'Pending'}
            </span>
          );
        })}
      </div>

      {(personalization?.arrivalMethodPreference || personalization?.arrivalConfidence) && (
        <p className="mt-3 text-xs text-slate-700">
          Context:
          {personalization.arrivalMethodPreference && ` method ${personalization.arrivalMethodPreference}`}
          {personalization.arrivalConfidence && `, confidence ${personalization.arrivalConfidence}`}
        </p>
      )}
    </section>
  );
});

export default StaffReadinessBadges;
