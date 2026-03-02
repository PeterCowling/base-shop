'use client';

import { type FC, memo } from 'react';
import { useTranslation } from 'react-i18next';

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
  labelKey: string;
}

const BADGE_CONFIG: ReadinessBadgeConfig[] = [
  { key: 'etaConfirmed', labelKey: 'etaShared' },
  { key: 'cashPrepared', labelKey: 'cashPrepared' },
  { key: 'routePlanned', labelKey: 'routePlanned' },
  { key: 'rulesReviewed', labelKey: 'rulesReviewed' },
  { key: 'locationSaved', labelKey: 'locationSaved' },
];

export const StaffReadinessBadges: FC<StaffReadinessBadgesProps> = memo(function StaffReadinessBadges({
  readiness,
  personalization,
  operational,
  className = '',
}) {
  const { t } = useTranslation('PreArrival');
  const signals = BADGE_CONFIG.map((badge) => ({
    id: badge.key,
    label: t(`staffReadiness.signals.${badge.labelKey}`),
    ready: readiness[badge.key] === true,
  }));

  return (
    <section className={`rounded-xl bg-muted p-4 ${className}`} aria-label="staff-readiness">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('staffReadiness.title')}
        </h3>
        <span className="rounded-full bg-border px-2 py-1 text-xs font-semibold text-foreground">
          {readiness.readinessScore}%
        </span>
      </div>

      <StaffSignalBadgeGroup title={t('staffReadiness.signalsTitle')} signals={signals} />

      {(personalization?.arrivalMethodPreference || personalization?.arrivalConfidence) && (
        <p className="mt-3 text-xs text-foreground">
          Context:
          {personalization.arrivalMethodPreference && ` method ${personalization.arrivalMethodPreference}`}
          {personalization.arrivalConfidence && `, confidence ${personalization.arrivalConfidence}`}
        </p>
      )}

      {operational?.bagDropRequested && (
        <p className="mt-2 text-xs font-medium text-warning-foreground">
          {t('staffReadiness.bagDropActive')}
        </p>
      )}
    </section>
  );
});

export default StaffReadinessBadges;
