/**
 * WelcomeHandoffStep.tsx
 *
 * Final onboarding screen shown after all profile setup is complete.
 * Celebrates completion, provides a quick summary of what's available,
 * and smoothly hands off to the main app experience.
 */

import { Button } from '@acme/ui';
import logger from '@/utils/logger';
import { CheckCircle, Compass, MessageCircle, Sparkles } from 'lucide-react';
import { FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompletedTaskMutator } from '../../hooks/mutator/useCompletedTaskMutator';
import OnboardingLayout from './OnboardingLayout';

interface WelcomeHandoffStepProps {
  /** Called after the user continues to the main app */
  onContinue: () => void;
  /** Current booking ID */
  bookingId: string;
  /** Guest's first name for personalization */
  guestName?: string;
}

const WelcomeHandoffStep: FC<WelcomeHandoffStepProps> = ({
  onContinue,
  bookingId,
  guestName,
}) => {
  const { t } = useTranslation('Onboarding');
  const { completeTask } = useCompletedTaskMutator({ bookingId });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await completeTask('onboardingHandoffComplete', true);
      onContinue();
    } catch (err) {
      logger.error('Failed to complete handoff:', err);
      onContinue();
    } finally {
      setIsSubmitting(false);
    }
  }, [completeTask, onContinue]);

  return (
    <OnboardingLayout currentStep={6} totalSteps={6} hideProgress>
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-8">
        {/* Success icon */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>

        {/* Headline */}
        <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
          {t('handoff.title', { name: guestName })}
        </h1>
        <p className="mb-8 text-center text-gray-600">
          {t('handoff.subtitle')}
        </p>

        {/* Quick highlights */}
        <div className="mb-8 w-full space-y-3">
          <HighlightItem
            icon={Compass}
            title={t('handoff.highlights.explore.title')}
            description={t('handoff.highlights.explore.description')}
          />
          <HighlightItem
            icon={MessageCircle}
            title={t('handoff.highlights.connect.title')}
            description={t('handoff.highlights.connect.description')}
          />
          <HighlightItem
            icon={Sparkles}
            title={t('handoff.highlights.quests.title')}
            description={t('handoff.highlights.quests.description')}
          />
        </div>

        {/* CTA */}
        <Button
          onClick={handleContinue}
          disabled={isSubmitting}
          className="w-full rounded-full bg-blue-500 px-6 py-4 text-lg font-semibold text-white shadow hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {t('handoff.cta')}
        </Button>
      </div>
    </OnboardingLayout>
  );
};

/** Highlight item for quick feature summary */
function HighlightItem({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Compass;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
        <Icon className="h-4 w-4 text-blue-600" />
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
}

export default WelcomeHandoffStep;
