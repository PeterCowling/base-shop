'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { useGuestProfileMutator } from '../../hooks/mutator/useGuestProfileMutator';
import useUuid from '../../hooks/useUuid';
import type { GuestIntent, GuestPace, GuestProfile, ProfileStatus } from '../../types/guestProfile';

export interface GuestProfileFormProps {
  effectiveProfile: Omit<GuestProfile, 'bookingId' | 'createdAt' | 'updatedAt'>;
  currentBookingId: string | null;
}

const INTERESTS = ['beaches', 'food', 'hiking', 'history', 'nightlife', 'photography'] as const;
const GOALS = ['adventure', 'explore', 'meetPeople', 'relax'] as const;

export function GuestProfileForm({ effectiveProfile, currentBookingId }: GuestProfileFormProps) {
  const { t } = useTranslation('Onboarding');
  const router = useRouter();
  const queryClient = useQueryClient();
  const uuid = useUuid();
  const { updateProfile, isLoading, isError, isSuccess } = useGuestProfileMutator();

  const [intent, setIntent] = useState<GuestIntent>(effectiveProfile.intent);
  const [interests, setInterests] = useState<string[]>(effectiveProfile.interests);
  const [stayGoals, setStayGoals] = useState<string[]>(effectiveProfile.stayGoals);
  const [pace, setPace] = useState<GuestPace>(effectiveProfile.pace);
  const [socialOptIn, setSocialOptIn] = useState<boolean>(effectiveProfile.socialOptIn);
  const [chatOptIn, setChatOptIn] = useState<boolean>(effectiveProfile.chatOptIn);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<'save' | 'skip' | null>(null);

  // On success: invalidate cache then navigate home
  useEffect(() => {
    if (isSuccess && pendingAction !== null) {
      setPendingAction(null);
      void queryClient.invalidateQueries({ queryKey: ['guestProfile', uuid] });
      router.push('/');
    }
  }, [isSuccess, pendingAction, queryClient, uuid, router]);

  // On error: show inline message, stay on page
  useEffect(() => {
    if (isError && pendingAction !== null) {
      setPendingAction(null);
      setSaveError(t('guestProfile.saveError'));
    }
  }, [isError, pendingAction, t]);

  function toggleChip(value: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);
  }

  const profileStatus: ProfileStatus = interests.length >= 1 ? 'complete' : 'partial';
  const isBusy = isLoading || pendingAction !== null;
  const isDisabled = isBusy || !uuid;

  async function handleSave() {
    if (!uuid) return;
    setSaveError(null);
    setPendingAction('save');
    await updateProfile({
      intent,
      interests,
      stayGoals,
      pace,
      socialOptIn,
      chatOptIn,
      profileStatus,
      bookingId: currentBookingId ?? '',
    });
  }

  async function handleSkip() {
    if (!uuid) return;
    setSaveError(null);
    setPendingAction('skip');
    await updateProfile({
      profileStatus: 'skipped',
      bookingId: currentBookingId ?? '',
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleSave();
      }}
      className="space-y-5"
    >
      {/* Intent */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          {t('guestProfile.intentLabel')}
        </h2>
        <div className="space-y-2">
          {(['social', 'quiet', 'mixed'] as GuestIntent[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={intent === value}
              disabled={isBusy}
              onClick={() => setIntent(value)}
              className={`flex w-full items-center rounded-lg border px-4 py-3 text-start text-sm font-medium transition-colors ${
                intent === value
                  ? 'border-primary bg-info-soft text-info-foreground'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
            >
              {t(`guestProfile.intent.${value}`)}
            </button>
          ))}
        </div>
      </section>

      {/* Interests */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          {t('guestProfile.interestsLabel')}
        </h2>
        {/* eslint-disable-next-line ds/enforce-layout-primitives -- BRIK-1 chip wrapping layout, no DS Cluster primitive in prime scope */}
        <div className="flex flex-wrap gap-2">
          {INTERESTS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={interests.includes(value)}
              disabled={isBusy}
              onClick={() => toggleChip(value, interests, setInterests)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                interests.includes(value)
                  ? 'border-primary bg-info-soft text-info-foreground'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
            >
              {t(`guestProfile.interests.${value}`)}
            </button>
          ))}
        </div>
      </section>

      {/* Stay Goals */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          {t('guestProfile.goalsLabel')}
        </h2>
        {/* eslint-disable-next-line ds/enforce-layout-primitives -- BRIK-1 chip wrapping layout, no DS Cluster primitive in prime scope */}
        <div className="flex flex-wrap gap-2">
          {GOALS.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={stayGoals.includes(value)}
              disabled={isBusy}
              onClick={() => toggleChip(value, stayGoals, setStayGoals)}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                stayGoals.includes(value)
                  ? 'border-primary bg-info-soft text-info-foreground'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
            >
              {t(`guestProfile.goals.${value}`)}
            </button>
          ))}
        </div>
      </section>

      {/* Pace */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          {t('guestProfile.paceLabel')}
        </h2>
        <div className="space-y-2">
          {(['relaxed', 'active'] as GuestPace[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={pace === value}
              disabled={isBusy}
              onClick={() => setPace(value)}
              className={`flex w-full flex-col rounded-lg border px-4 py-3 text-start transition-colors ${
                pace === value
                  ? 'border-primary bg-info-soft text-info-foreground'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
            >
              <span className="text-sm font-medium">{t(`guestProfile.pace.${value}`)}</span>
              <span className="text-xs opacity-70">{t(`guestProfile.pace.${value}Desc`)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Social Opt-In */}
      <section>
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm font-medium text-foreground">
            {t('guestProfile.socialOptInLabel')}
          </span>
          <input
            type="checkbox"
            checked={socialOptIn}
            disabled={isBusy}
            onChange={(e) => setSocialOptIn(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>
      </section>

      {/* Chat Opt-In */}
      <section>
        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <span className="text-sm font-medium text-foreground">
            {t('guestProfile.chatOptInLabel')}
          </span>
          <input
            type="checkbox"
            checked={chatOptIn}
            disabled={isBusy}
            onChange={(e) => setChatOptIn(e.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>
      </section>

      {/* Inline error */}
      {saveError && (
        <p
          data-cy="save-error"
          role="alert"
          className="rounded-lg border border-destructive bg-destructive/10 px-4 py-2 text-sm text-destructive"
        >
          {saveError}
        </p>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-1">
        <button
          type="submit"
          disabled={isDisabled}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {t('guestProfile.saveCta')}
        </button>
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => {
            void handleSkip();
          }}
          className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-opacity disabled:opacity-50"
        >
          {t('guestProfile.skipCta')}
        </button>
      </div>
    </form>
  );
}
