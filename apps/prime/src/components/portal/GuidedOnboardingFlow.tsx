'use client';

import { CheckCircle2, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ROUTES_TO_POSITANO } from '../../data/routes';
import {
  getChecklistItemLabel,
  getDefaultEtaWindow,
  getEtaWindowOptions,
  sortRoutesForPersonalization,
  writeLastCompletedChecklistItem,
} from '../../lib/preArrival';
import { usePreArrivalMutator } from '../../hooks/mutator/usePreArrivalMutator';
import { useFetchPreArrivalData } from '../../hooks/pureData/useFetchPreArrivalData';
import type { ArrivalConfidence, ChecklistProgress, EtaMethod } from '../../types/preArrival';

type Step = 1 | 2 | 3;

interface GuidedOnboardingFlowProps {
  guestFirstName?: string | null;
  onComplete: () => void;
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

function normalizeConfidence(confidence: string | null): ArrivalConfidence | null {
  if (confidence === 'confident' || confidence === 'need-guidance') {
    return confidence;
  }

  return null;
}

export default function GuidedOnboardingFlow({
  guestFirstName,
  onComplete,
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

  const etaWindowOptions = useMemo(() => {
    return getEtaWindowOptions(arrivalConfidence);
  }, [arrivalConfidence]);

  const stepProgressPercent = Math.round((step / 3) * 100);

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

      showCelebration('Nice work. Your arrival checklist is moving forward.');
      onComplete();
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-md space-y-5 rounded-2xl bg-white p-5 shadow-sm">
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            <Sparkles className="h-3.5 w-3.5" />
            Step {step} of 3
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {guestFirstName ? `Welcome ${guestFirstName}, let’s get you arrival-ready` : 'Let’s get you arrival-ready'}
          </h1>
          <p className="text-sm text-gray-600">
            Finish these quick steps to reduce reception wait time and avoid arrival surprises.
          </p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
              style={{ width: `${stepProgressPercent}%` }}
            />
          </div>
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Privacy reassurance
            </div>
            We only use this information for your current stay and reception operations.
          </div>
        </header>

        {celebration && (
          <div className="flex animate-pulse items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {celebration}
          </div>
        )}

        {step === 1 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Choose your arrival style</h2>
            <p className="text-sm text-gray-600">This lets us recommend the best route and defaults for you.</p>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-800">How are you most likely arriving?</p>
              <div className="grid grid-cols-2 gap-2">
                {(['ferry', 'bus', 'train', 'taxi'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setArrivalMethodPreference(method)}
                    className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                      arrivalMethodPreference === method
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-800">How confident do you feel about getting here?</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setArrivalConfidence('confident')}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    arrivalConfidence === 'confident'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  Confident
                </button>
                <button
                  type="button"
                  onClick={() => setArrivalConfidence('need-guidance')}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    arrivalConfidence === 'need-guidance'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  Need guidance
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-800">Recommended routes</p>
              {routeSuggestions.map((route) => (
                <button
                  key={route.slug}
                  type="button"
                  onClick={() => setSelectedRouteSlug(route.slug)}
                  className={`w-full rounded-lg border px-3 py-2 text-left ${
                    selectedRouteSlug === route.slug
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-slate-200'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{route.title}</p>
                  <p className="text-xs text-slate-600">{route.description}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => void handleStepOneContinue()}
                disabled={isSaving}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Save and continue
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Share your ETA</h2>
            <p className="text-sm text-gray-600">Sharing ETA helps reception prioritize fast check-in on arrival.</p>

            <label className="block text-sm font-medium text-gray-800">
              Arrival time window
              <select
                value={etaWindow}
                onChange={(event) => setEtaWindow(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {etaWindowOptions.map((window) => (
                  <option key={window} value={window}>
                    {window}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-gray-800">
              Travel method
              <select
                value={etaMethod}
                onChange={(event) => setEtaMethod(normalizeMethod(event.target.value) ?? 'other')}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                {(['ferry', 'bus', 'train', 'taxi', 'private', 'other'] as const).map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={() => void handleStepTwoContinue()}
                disabled={isSaving}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Save ETA
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Final readiness checks</h2>
            <p className="text-sm text-gray-600">Complete what you can now. You can edit everything later on the dashboard.</p>

            <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={cashPrepared}
                onChange={(event) => setCashPrepared(event.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              I have prepared cash for city tax and keycard deposit
            </label>

            <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={rulesReviewed}
                onChange={(event) => setRulesReviewed(event.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              I reviewed the house rules
            </label>

            <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={locationSaved}
                onChange={(event) => setLocationSaved(event.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              I saved the hostel location in maps
            </label>

            {lastCompletedItem && (
              <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs font-medium text-sky-700">
                Last completion: {getChecklistItemLabel(lastCompletedItem)}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onComplete}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700"
              >
                Skip to dashboard
              </button>
              <button
                type="button"
                onClick={() => void handleFinish()}
                disabled={isSaving}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                Finish setup
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
