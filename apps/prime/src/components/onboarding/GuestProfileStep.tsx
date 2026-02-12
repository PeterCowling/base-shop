/**
 * GuestProfileStep.tsx
 *
 * Onboarding step to capture guest intent, interests, and stay preferences.
 * All fields are optional - users can skip to apply defaults.
 *
 * Captures:
 * - Intent: social, quiet, or mixed vibe
 * - Interests: activities they're interested in
 * - Stay goals: what they want from their stay
 * - Pace: relaxed or active
 */

import { type FC, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Moon, Sparkles, Sun, Users, Zap } from 'lucide-react';

import { Button } from '@acme/design-system/primitives';

import logger from '@/utils/logger';

import { useCompletedTaskMutator } from '../../hooks/mutator/useCompletedTaskMutator';
import { useGuestProfileMutator } from '../../hooks/mutator/useGuestProfileMutator';
import type {
  GuestIntent,
  GuestPace,
  GuestProfile,
} from '../../types/guestProfile';
import { DEFAULT_GUEST_PROFILE } from '../../types/guestProfile';

import OnboardingLayout from './OnboardingLayout';

interface GuestProfileStepProps {
  /** Called after profile is saved or skipped */
  onContinue: () => void;
  /** Current booking ID to associate with profile */
  bookingId: string;
}

/** Available interest options */
const INTEREST_OPTIONS = [
  { id: 'hiking', labelKey: 'guestProfile.interests.hiking' },
  { id: 'beaches', labelKey: 'guestProfile.interests.beaches' },
  { id: 'food', labelKey: 'guestProfile.interests.food' },
  { id: 'nightlife', labelKey: 'guestProfile.interests.nightlife' },
  { id: 'history', labelKey: 'guestProfile.interests.history' },
  { id: 'photography', labelKey: 'guestProfile.interests.photography' },
] as const;

/** Available stay goal options */
const GOAL_OPTIONS = [
  { id: 'relax', labelKey: 'guestProfile.goals.relax' },
  { id: 'explore', labelKey: 'guestProfile.goals.explore' },
  { id: 'meet-people', labelKey: 'guestProfile.goals.meetPeople' },
  { id: 'adventure', labelKey: 'guestProfile.goals.adventure' },
] as const;

const GuestProfileStep: FC<GuestProfileStepProps> = ({
  onContinue,
  bookingId,
}) => {
  const { t } = useTranslation('Onboarding');
  const { setProfile } = useGuestProfileMutator();
  const { completeTask } = useCompletedTaskMutator({});

  // Form state
  const [intent, setIntent] = useState<GuestIntent>('mixed');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [pace, setPace] = useState<GuestPace>('relaxed');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle interest selection
  const toggleInterest = useCallback((interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId],
    );
  }, []);

  // Toggle goal selection
  const toggleGoal = useCallback((goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((id) => id !== goalId)
        : [...prev, goalId],
    );
  }, []);

  // Save profile and continue
  const handleSave = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const now = Date.now();
      const profile: GuestProfile = {
        bookingId,
        profileStatus: 'complete',
        intent,
        interests: selectedInterests,
        stayGoals: selectedGoals,
        pace,
        socialOptIn: intent !== 'quiet',
        chatOptIn: false,
        blockedUsers: [],
        createdAt: now,
        updatedAt: now,
      };

      await setProfile(profile);
      await completeTask('profileOnboardingComplete', true);
      onContinue();
    } catch (err) {
      logger.error('Failed to save guest profile:', err);
      // Continue anyway to not block the user
      onContinue();
    } finally {
      setIsSubmitting(false);
    }
  }, [
    bookingId,
    intent,
    selectedInterests,
    selectedGoals,
    pace,
    setProfile,
    completeTask,
    onContinue,
  ]);

  // Skip and apply defaults
  const handleSkip = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const now = Date.now();
      const profile: GuestProfile = {
        ...DEFAULT_GUEST_PROFILE,
        bookingId,
        profileStatus: 'skipped',
        createdAt: now,
        updatedAt: now,
      };

      await setProfile(profile);
      await completeTask('profileOnboardingComplete', true);
      onContinue();
    } catch (err) {
      logger.error('Failed to save skipped profile:', err);
      onContinue();
    } finally {
      setIsSubmitting(false);
    }
  }, [bookingId, setProfile, completeTask, onContinue]);

  return (
    <OnboardingLayout
      currentStep={5}
      totalSteps={5}
      title={t('guestProfile.title')}
    >
      <div className="space-y-6 px-2 pb-6">
        {/* Intent selection */}
        <section>
          <h3 className="mb-3 text-base font-medium text-foreground">
            {t('guestProfile.intentLabel')}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <IntentButton
              icon={Users}
              label={t('guestProfile.intent.social')}
              selected={intent === 'social'}
              onClick={() => setIntent('social')}
            />
            <IntentButton
              icon={Moon}
              label={t('guestProfile.intent.quiet')}
              selected={intent === 'quiet'}
              onClick={() => setIntent('quiet')}
            />
            <IntentButton
              icon={Sparkles}
              label={t('guestProfile.intent.mixed')}
              selected={intent === 'mixed'}
              onClick={() => setIntent('mixed')}
            />
          </div>
        </section>

        {/* Interests */}
        <section>
          <h3 className="mb-3 text-base font-medium text-foreground">
            {t('guestProfile.interestsLabel')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(({ id, labelKey }) => (
              <ChipButton
                key={id}
                label={t(labelKey)}
                selected={selectedInterests.includes(id)}
                onClick={() => toggleInterest(id)}
              />
            ))}
          </div>
        </section>

        {/* Goals */}
        <section>
          <h3 className="mb-3 text-base font-medium text-foreground">
            {t('guestProfile.goalsLabel')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map(({ id, labelKey }) => (
              <ChipButton
                key={id}
                label={t(labelKey)}
                selected={selectedGoals.includes(id)}
                onClick={() => toggleGoal(id)}
              />
            ))}
          </div>
        </section>

        {/* Pace */}
        <section>
          <h3 className="mb-3 text-base font-medium text-foreground">
            {t('guestProfile.paceLabel')}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <PaceButton
              icon={Sun}
              label={t('guestProfile.pace.relaxed')}
              description={t('guestProfile.pace.relaxedDesc')}
              selected={pace === 'relaxed'}
              onClick={() => setPace('relaxed')}
            />
            <PaceButton
              icon={Zap}
              label={t('guestProfile.pace.active')}
              description={t('guestProfile.pace.activeDesc')}
              selected={pace === 'active'}
              onClick={() => setPace('active')}
            />
          </div>
        </section>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {t('guestProfile.saveCta')}
          </Button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSubmitting}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {t('guestProfile.skipCta')}
          </button>
        </div>
      </div>
    </OnboardingLayout>
  );
};

/** Intent selection button */
function IntentButton({
  icon: Icon,
  label,
  selected,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all ${
        selected
          ? 'border-primary bg-primary-soft text-primary'
          : 'border-border bg-card text-muted-foreground hover:bg-muted'
      }`}
    >
      <Icon size={24} />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

/** Chip-style multi-select button */
function ChipButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
        selected
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-foreground hover:bg-muted/80'
      }`}
    >
      {selected && <Check size={14} />}
      {label}
    </button>
  );
}

/** Pace selection button */
function PaceButton({
  icon: Icon,
  label,
  description,
  selected,
  onClick,
}: {
  icon: typeof Sun;
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-lg border-2 p-3 text-left transition-all ${
        selected
          ? 'border-primary bg-primary-soft'
          : 'border-border bg-card hover:bg-muted'
      }`}
    >
      <div className="flex items-center gap-2">
        <Icon size={18} className={selected ? 'text-primary' : 'text-muted-foreground'} />
        <span className={`text-sm font-medium ${selected ? 'text-primary' : 'text-foreground'}`}>
          {label}
        </span>
      </div>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}

export default GuestProfileStep;
