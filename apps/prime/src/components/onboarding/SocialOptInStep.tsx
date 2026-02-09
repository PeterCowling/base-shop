/**
 * SocialOptInStep.tsx
 *
 * Onboarding step to invite guests to opt into social features:
 * - Hostel activities (sunset drinks, group dinners, etc.)
 * - Group chat with other guests
 *
 * Shows upcoming activities if any exist, or a guidebook CTA otherwise.
 * All opt-ins are optional - users can skip entirely.
 */

import { type FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Map, MessageCircle, Users } from 'lucide-react';

import { Button } from '@acme/design-system/primitives';

import logger from '@/utils/logger';

import { useChat } from '../../contexts/messaging/ChatProvider';
import { useGuestProfileMutator } from '../../hooks/mutator/useGuestProfileMutator';

import OnboardingLayout from './OnboardingLayout';

interface SocialOptInStepProps {
  /** Called after opt-in choices are saved or skipped */
  onContinue: () => void;
  /** Current booking ID */
  bookingId: string;
}

const SocialOptInStep: FC<SocialOptInStepProps> = ({
  onContinue,
  bookingId: _bookingId,
}) => {
  const { t } = useTranslation('Onboarding');
  const { updateProfile } = useGuestProfileMutator();
  const { activities } = useChat();

  // Form state
  const [socialOptIn, setSocialOptIn] = useState(true);
  const [chatOptIn, setChatOptIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if there are upcoming activities
  const upcomingActivities = Object.values(activities || {})
    .filter((activity) => activity.startTime > Date.now())
    .sort((a, b) => a.startTime - b.startTime)
    .slice(0, 3);

  const hasActivities = upcomingActivities.length > 0;

  // Save preferences and continue
  const handleSave = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await updateProfile({
        socialOptIn,
        chatOptIn,
      });
      onContinue();
    } catch (err) {
      logger.error('Failed to save social opt-in:', err);
      onContinue();
    } finally {
      setIsSubmitting(false);
    }
  }, [socialOptIn, chatOptIn, updateProfile, onContinue]);

  // Skip without opting in
  const handleSkip = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await updateProfile({
        socialOptIn: false,
        chatOptIn: false,
      });
      onContinue();
    } catch (err) {
      logger.error('Failed to save skipped social opt-in:', err);
      onContinue();
    } finally {
      setIsSubmitting(false);
    }
  }, [updateProfile, onContinue]);

  return (
    <OnboardingLayout
      currentStep={5}
      totalSteps={6}
      title={t('socialOptIn.title')}
    >
      <div className="space-y-6 px-2 pb-6">
        {/* Intro text */}
        <p className="text-sm text-gray-600 leading-relaxed">
          {t('socialOptIn.intro')}
        </p>

        {/* Social features options */}
        <div className="space-y-3">
          {/* Activities opt-in */}
          <OptInCard
            icon={Calendar}
            title={t('socialOptIn.activities.title')}
            description={t('socialOptIn.activities.description')}
            checked={socialOptIn}
            onChange={setSocialOptIn}
          />

          {/* Chat opt-in */}
          <OptInCard
            icon={MessageCircle}
            title={t('socialOptIn.chat.title')}
            description={t('socialOptIn.chat.description')}
            checked={chatOptIn}
            onChange={setChatOptIn}
          />
        </div>

        {/* Show upcoming activities or guidebook CTA */}
        {hasActivities ? (
          <section className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Users size={16} />
              {t('socialOptIn.upcomingActivities')}
            </h3>
            <div className="space-y-2">
              {upcomingActivities.map((activity) => (
                <ActivityPreview
                  key={activity.id}
                  title={activity.title}
                  time={activity.startTime}
                />
              ))}
            </div>
          </section>
        ) : (
          <section className="mt-6 rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <Map className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-amber-900">
                  {t('socialOptIn.noActivities.title')}
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  {t('socialOptIn.noActivities.description')}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Privacy note */}
        <p className="text-xs text-gray-500 leading-relaxed">
          {t('socialOptIn.privacyNote')}
        </p>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full rounded-full bg-blue-500 px-6 py-3 font-medium text-white shadow hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {t('socialOptIn.saveCta')}
          </Button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            {t('socialOptIn.skipCta')}
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

/** Opt-in toggle card */
function OptInCard({
  icon: Icon,
  title,
  description,
  checked,
  onChange,
}: {
  icon: typeof Calendar;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
        checked
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
          checked ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
            <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7a1 1 0 00-1.414-1.414z" />
          </svg>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Icon size={18} className={checked ? 'text-blue-600' : 'text-gray-500'} />
          <span className={`text-sm font-medium ${checked ? 'text-blue-700' : 'text-gray-700'}`}>
            {title}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
    </label>
  );
}

/** Activity preview card */
function ActivityPreview({ title, time }: { title: string; time: number }) {
  const formattedTime = new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(time));

  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
      <Calendar size={16} className="text-gray-400" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500">{formattedTime}</p>
      </div>
    </div>
  );
}

export default SocialOptInStep;
