'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronRight, ExternalLink, MapPin } from 'lucide-react';

import { StepFlowShell } from '@acme/design-system/primitives';
import ExperimentGate from '@acme/ui/components/ab/ExperimentGate';

import { ROUTES_TO_POSITANO } from '../../data/routes';
import { usePreArrivalMutator } from '../../hooks/mutator/usePreArrivalMutator';
import { useFetchPreArrivalData } from '../../hooks/pureData/useFetchPreArrivalData';
import { recordActivationFunnelEvent } from '../../lib/analytics/activationFunnel';
import { assignActivationVariants } from '../../lib/experiments/activationExperiments';
import {
  getChecklistItemLabel,
  getDefaultEtaWindow,
  getEtaWindowOptions,
  sortRoutesForPersonalization,
  writeLastCompletedChecklistItem,
} from '../../lib/preArrival';
import type { ArrivalConfidence, ChecklistProgress, EtaMethod } from '../../types/preArrival';

type Step = 1 | 2 | 3;

const HOSTEL_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Hostel+Brikette+Via+Cristoforo+Colombo+13+Positano';

interface GuidedOnboardingFlowProps {
  guestFirstName?: string | null;
  onComplete: () => void;
  onClose?: () => void;
}

function normalizeMethod(method: string | null): EtaMethod | null {
  if (
    method === 'ferry' ||
    method === 'bus' ||
    method === 'taxi' ||
    method === 'private' ||
    method === 'train' ||
    method === 'other'
  ) {
    return method;
  }

  return null;
}

function getFunnelSessionKey(): string {
  if (typeof window === 'undefined') {
    return 'unknown-session';
  }

  return (
    localStorage.getItem('prime_guest_uuid') ||
    localStorage.getItem('prime_guest_booking_id') ||
    'unknown-session'
  );
}

function normalizeConfidence(confidence: string | null): ArrivalConfidence | null {
  if (confidence === 'confident' || confidence === 'need-guidance') {
    return confidence;
  }

  return null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function GuidedOnboardingFlow({
  guestFirstName,
  onComplete,
  onClose,
}: GuidedOnboardingFlowProps) {
  const [step, setStep] = useState<Step>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);

  const { effectiveData, isLoading } = useFetchPreArrivalData();
  const {
    setPersonalization,
    saveRoute,
    setEta,
    updateChecklistItem,
  } = usePreArrivalMutator();

  const [arrivalMethodPreference, setArrivalMethodPreference] = useState<EtaMethod | null>(null);
  const [arrivalConfidence, setArrivalConfidence] = useState<ArrivalConfidence | null>(null);
  const [selectedRouteSlug, setSelectedRouteSlug] = useState<string | null>(null);
  const [etaWindow, setEtaWindow] = useState<string>('18:00-18:30');
  const [etaMethod, setEtaMethod] = useState<EtaMethod>('other');
  const [cashPrepared, setCashPrepared] = useState(false);
  const [rulesReviewed, setRulesReviewed] = useState(false);
  const [locationSaved, setLocationSaved] = useState(false);
  const [lastCompletedItem, setLastCompletedItem] = useState<keyof ChecklistProgress | null>(null);

  const didInitRef = useRef(false);
  const celebrationTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading || didInitRef.current) {
      return;
    }

    didInitRef.current = true;
    const method = normalizeMethod(effectiveData.arrivalMethodPreference);
    const confidence = normalizeConfidence(effectiveData.arrivalConfidence);
    const defaultWindow = getDefaultEtaWindow(confidence);

    setArrivalMethodPreference(method);
    setArrivalConfidence(confidence);
    setSelectedRouteSlug(effectiveData.routeSaved);
    setEtaWindow(effectiveData.etaWindow ?? defaultWindow);
    setEtaMethod(normalizeMethod(effectiveData.etaMethod) ?? method ?? 'other');
    setCashPrepared(effectiveData.checklistProgress.cashPrepared);
    setRulesReviewed(effectiveData.checklistProgress.rulesReviewed);
    setLocationSaved(effectiveData.checklistProgress.locationSaved);
  }, [effectiveData, isLoading]);

  useEffect(() => {
    if (!arrivalMethodPreference) {
      return;
    }

    setEtaMethod(arrivalMethodPreference);
  }, [arrivalMethodPreference]);

  useEffect(() => {
    const options = getEtaWindowOptions(arrivalConfidence);
    if (!options.includes(etaWindow)) {
      setEtaWindow(options[0]);
    }
  }, [arrivalConfidence, etaWindow]);

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) {
        window.clearTimeout(celebrationTimeoutRef.current);
      }
    };
  }, []);

  const routeSuggestions = useMemo(() => {
    return sortRoutesForPersonalization(ROUTES_TO_POSITANO, arrivalMethodPreference).slice(0, 3);
  }, [arrivalMethodPreference]);

  const sessionKey = useMemo(() => getFunnelSessionKey(), []);
  const experimentVariants = useMemo(
    () => assignActivationVariants(sessionKey),
    [sessionKey],
  );
  const showConfidenceBeforeMethod = experimentVariants.onboardingStepOrder === 'eta-first';

  const etaWindowOptions = useMemo(() => {
    return getEtaWindowOptions(arrivalConfidence);
  }, [arrivalConfidence]);

  // Step-dependent content for StepFlowShell
  const stepTitle = useMemo(() => {
    if (step === 1) {
      return guestFirstName
        ? `Welcome ${guestFirstName}, let\u2019s get you arrival-ready`
        : 'Let\u2019s get you arrival-ready';
    }
    if (step === 2) {
      return 'Share your ETA';
    }
    return 'Final checks';
  }, [step, guestFirstName]);

  const stepDescription = useMemo((): ReactNode => {
    if (step === 1) {
      return (
        <ExperimentGate
          flag="prime-onboarding-cta-copy"
          enabled={experimentVariants.onboardingCtaCopy === 'value-led'}
          fallback="Finish these quick steps to reduce reception wait time and avoid arrival surprises."
        >
          Unlock faster check-in and sharper local recommendations by completing these steps now.
        </ExperimentGate>
      );
    }
    if (step === 2) {
      return 'Sharing your ETA helps reception prepare for a faster check-in.';
    }
    return 'Tick off what you can \u2014 update any time from the dashboard.';
  }, [step, experimentVariants.onboardingCtaCopy]);

  function showCelebration(message: string) {
    if (celebrationTimeoutRef.current) {
      window.clearTimeout(celebrationTimeoutRef.current);
    }

    setCelebration(message);
    celebrationTimeoutRef.current = window.setTimeout(() => {
      setCelebration(null);
    }, 1400);
  }

  async function handleStepOneContinue() {
    setIsSaving(true);

    try {
      await setPersonalization(arrivalMethodPreference, arrivalConfidence);

      if (selectedRouteSlug) {
        await saveRoute(selectedRouteSlug);
        setLastCompletedItem('routePlanned');
        writeLastCompletedChecklistItem('routePlanned');
      }
      recordActivationFunnelEvent({
        type: 'guided_step_complete',
        sessionKey,
        route: '/portal',
        stepId: 'step-1',
        variant: experimentVariants.onboardingCtaCopy,
        context: {
          stepOrder: experimentVariants.onboardingStepOrder,
        },
      });

      showCelebration('Great start. Your arrival path is now personalized.');
      setStep(2);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStepTwoContinue() {
    setIsSaving(true);

    try {
      await setEta(etaWindow, etaMethod, '');
      setLastCompletedItem('etaConfirmed');
      writeLastCompletedChecklistItem('etaConfirmed');
      recordActivationFunnelEvent({
        type: 'guided_step_complete',
        sessionKey,
        route: '/portal',
        stepId: 'step-2',
        variant: experimentVariants.onboardingCtaCopy,
        context: {
          stepOrder: experimentVariants.onboardingStepOrder,
        },
      });
      showCelebration('ETA shared. Reception can now prepare your arrival.');
      setStep(3);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleFinish() {
    setIsSaving(true);

    try {
      if (cashPrepared) {
        await updateChecklistItem('cashPrepared', true);
        setLastCompletedItem('cashPrepared');
        writeLastCompletedChecklistItem('cashPrepared');
      }

      if (rulesReviewed) {
        await updateChecklistItem('rulesReviewed', true);
        setLastCompletedItem('rulesReviewed');
        writeLastCompletedChecklistItem('rulesReviewed');
      }

      if (locationSaved) {
        await updateChecklistItem('locationSaved', true);
        setLastCompletedItem('locationSaved');
        writeLastCompletedChecklistItem('locationSaved');
      }
      recordActivationFunnelEvent({
        type: 'guided_step_complete',
        sessionKey,
        route: '/portal',
        stepId: 'step-3',
        variant: experimentVariants.onboardingCtaCopy,
        context: {
          stepOrder: experimentVariants.onboardingStepOrder,
        },
      });

      showCelebration('Nice work. Your arrival checklist is moving forward.');
      onComplete();
    } finally {
      setIsSaving(false);
    }
  }

  function handleBack() {
    if (step === 1) {
      onClose?.();
    } else {
      setStep((step - 1) as Step);
    }
  }

  const handleOpenMaps = useCallback(() => {
    setLocationSaved(true);
    if (typeof window !== 'undefined') {
      window.open(HOSTEL_MAPS_URL, '_blank');
    }
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted px-4 py-6">
      <div className="mx-auto max-w-md space-y-5 rounded-2xl bg-background p-5 shadow-md">
        <StepFlowShell
          currentStep={step}
          totalSteps={3}
          title={stepTitle}
          description={stepDescription}
          trustCue={step === 1 ? {
            title: 'Privacy reassurance',
            description: 'We only use this information for your current stay and reception operations.',
          } : undefined}
          milestoneMessage={celebration}
          onBack={handleBack}
        >

        {/* ── Step 1: Arrival style ── */}
        {step === 1 && (
          <section className="space-y-5">
            {showConfidenceBeforeMethod ? (
              <>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-foreground">How confident do you feel about getting here?</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'confident' as const, label: 'Confident' },
                      { value: 'need-guidance' as const, label: 'Need guidance' },
                    ]).map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={arrivalConfidence === value}
                        onClick={() => setArrivalConfidence(value)}
                        className={`flex items-center justify-center gap-1.5 rounded-full border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                          arrivalConfidence === value
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border text-foreground hover:border-border-strong'
                        }`}
                      >
                        {arrivalConfidence === value && <Check className="h-3.5 w-3.5" />}
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-foreground">How are you most likely arriving?</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(['ferry', 'bus', 'train', 'taxi'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        role="radio"
                        aria-checked={arrivalMethodPreference === method}
                        onClick={() => setArrivalMethodPreference(method)}
                        className={`flex items-center justify-center gap-1.5 rounded-full border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                          arrivalMethodPreference === method
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border text-foreground hover:border-border-strong'
                        }`}
                      >
                        {arrivalMethodPreference === method && <Check className="h-3.5 w-3.5" />}
                        {capitalize(method)}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            ) : (
              <>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-foreground">How are you most likely arriving?</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(['ferry', 'bus', 'train', 'taxi'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        role="radio"
                        aria-checked={arrivalMethodPreference === method}
                        onClick={() => setArrivalMethodPreference(method)}
                        className={`flex items-center justify-center gap-1.5 rounded-full border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                          arrivalMethodPreference === method
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border text-foreground hover:border-border-strong'
                        }`}
                      >
                        {arrivalMethodPreference === method && <Check className="h-3.5 w-3.5" />}
                        {capitalize(method)}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-foreground">How confident do you feel about getting here?</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: 'confident' as const, label: 'Confident' },
                      { value: 'need-guidance' as const, label: 'Need guidance' },
                    ]).map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={arrivalConfidence === value}
                        onClick={() => setArrivalConfidence(value)}
                        className={`flex items-center justify-center gap-1.5 rounded-full border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                          arrivalConfidence === value
                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border text-foreground hover:border-border-strong'
                        }`}
                      >
                        {arrivalConfidence === value && <Check className="h-3.5 w-3.5" />}
                        {label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            )}

            {arrivalMethodPreference && (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">Pick a route <span className="font-normal text-foreground/60">(optional)</span></legend>
                <div className="space-y-2" role="radiogroup" aria-label="Recommended routes">
                  {routeSuggestions.map((route) => {
                    const isSelected = selectedRouteSlug === route.slug;
                    return (
                      <button
                        key={route.slug}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelectedRouteSlug(isSelected ? null : route.slug)}
                        className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                          isSelected
                            ? 'border-primary bg-primary-soft shadow-sm'
                            : 'border-border hover:border-border-strong'
                        }`}
                      >
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/40'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-foreground">{route.title}</span>
                          <span className="block text-xs text-foreground/70">{route.description}</span>
                        </span>
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => void handleStepOneContinue()}
                disabled={isSaving}
                className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:opacity-60"
              >
                Save and continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* ── Step 2: Share ETA ── */}
        {step === 2 && (
          <section className="space-y-4">
            <label className="block text-sm font-medium text-foreground">
              Arrival time window
              <select
                value={etaWindow}
                onChange={(event) => setEtaWindow(event.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-foreground"
              >
                {etaWindowOptions.map((window) => (
                  <option key={window} value={window}>
                    {window}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-foreground">
              Travel method
              <select
                value={etaMethod}
                onChange={(event) => setEtaMethod(normalizeMethod(event.target.value) ?? 'other')}
                className="mt-2 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-foreground"
              >
                {(['ferry', 'bus', 'train', 'taxi', 'private', 'other'] as const).map((method) => (
                  <option key={method} value={method}>
                    {capitalize(method)}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => void handleStepTwoContinue()}
                disabled={isSaving}
                className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:opacity-60"
              >
                Save and continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* ── Step 3: Final readiness checks ── */}
        {step === 3 && (
          <section className="space-y-3">
            {/* Cash for check-in */}
            <button
              type="button"
              onClick={() => setCashPrepared(!cashPrepared)}
              className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all active:scale-[0.98] ${
                cashPrepared
                  ? 'border-success/40 bg-success-soft'
                  : 'border-border bg-card hover:border-border-strong'
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors ${
                  cashPrepared
                    ? 'bg-success text-success-foreground'
                    : 'border-2 border-muted-foreground/40'
                }`}
              >
                {cashPrepared && <Check className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  Cash for check-in
                </span>
                <span className="block text-xs text-foreground/70">
                  City tax + keycard deposit in cash — avoids delays at reception
                </span>
              </span>
            </button>

            {/* House rules */}
            <button
              type="button"
              onClick={() => setRulesReviewed(!rulesReviewed)}
              className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all active:scale-[0.98] ${
                rulesReviewed
                  ? 'border-success/40 bg-success-soft'
                  : 'border-border bg-card hover:border-border-strong'
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors ${
                  rulesReviewed
                    ? 'bg-success text-success-foreground'
                    : 'border-2 border-muted-foreground/40'
                }`}
              >
                {rulesReviewed && <Check className="h-4 w-4" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  House rules
                </span>
                <span className="block text-xs text-foreground/70">
                  Quick read — helps your stay go smoothly
                </span>
              </span>
            </button>

            {/* Save hostel location */}
            <button
              type="button"
              onClick={handleOpenMaps}
              className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-all active:scale-[0.98] ${
                locationSaved
                  ? 'border-success/40 bg-success-soft'
                  : 'border-border bg-card hover:border-border-strong'
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded transition-colors ${
                  locationSaved
                    ? 'bg-success text-success-foreground'
                    : 'border-2 border-muted-foreground/40'
                }`}
              >
                {locationSaved ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">
                  Save hostel location
                </span>
                <span className="flex items-center gap-1 text-xs text-primary">
                  Open in Maps
                  <ExternalLink className="h-3 w-3" />
                </span>
              </span>
            </button>

            {lastCompletedItem && (
              <p className="rounded-lg bg-info-soft px-3 py-2 text-xs font-medium text-info-foreground">
                Last completed: {getChecklistItemLabel(lastCompletedItem)}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onComplete}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => void handleFinish()}
                disabled={isSaving}
                className="ml-auto flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-md disabled:opacity-60"
              >
                Finish
                <Check className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}
        </StepFlowShell>
      </div>
    </main>
  );
}
