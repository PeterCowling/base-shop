/* eslint-disable ds/no-hardcoded-copy -- BRIK-2 meal-orders i18n deferred */
'use client';

import { useEffect } from 'react';

import { StepFlowShell } from '@acme/design-system/primitives';

import { evDrinkTimes } from '@/config/meal-orders/menuData';
import type { GuestBookingSnapshot } from '@/hooks/dataOrchestrator/useGuestBookingSnapshot';
import { useEvDrinkWizard } from '@/hooks/meal-orders/useEvDrinkWizard';
import { buildEvDrinkOrderValue } from '@/lib/meal-orders/buildOrderValue';

// ---------------------------------------------------------------------------
// Modifier label map (mirrors buildOrderValue.ts MODIFIER_LABELS)
// ---------------------------------------------------------------------------

const MODIFIER_DISPLAY_LABELS: Record<string, string> = {
  milk: 'With Milk',
  sugar: 'With Sugar',
  sweetened: 'Sweetened',
};

function resolveModifierDisplayLabel(key: string): string {
  if (key in MODIFIER_DISPLAY_LABELS) {
    return MODIFIER_DISPLAY_LABELS[key];
  }
  const capitalised = key.charAt(0).toUpperCase() + key.slice(1);
  return `With ${capitalised}`;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface EvDrinkOrderWizardProps {
  serviceDate: string;
  preorders: GuestBookingSnapshot['preorders'];
  onSubmit: (value: string) => void;
  isSubmitting: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EvDrinkOrderWizard({
  serviceDate,
  preorders,
  onSubmit,
  isSubmitting,
}: EvDrinkOrderWizardProps) {
  const wizard = useEvDrinkWizard({ preorders, serviceDate });

  // Reset wizard when the service date changes (e.g. user picks a different night)
  useEffect(() => {
    wizard.resetWizard();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- BRIK-2 intentionally only depends on serviceDate
  }, [serviceDate]);

  // ---------------------------------------------------------------------------
  // Step metadata
  // ---------------------------------------------------------------------------

  const stepTitles: Record<string, string> = {
    drink: 'Choose your drink',
    modifier: 'Customise your drink',
    time: 'Choose a delivery time',
    confirmation: 'Confirm your order',
  };

  const stepDescriptions: Record<string, string> = {
    drink: 'Select a drink from the options below.',
    modifier: 'Add any extras you would like.',
    time: 'Select when you would like your drink delivered.',
    confirmation: 'Please review your order before submitting.',
  };

  const { activeStep } = wizard;
  const title = stepTitles[activeStep] ?? '';
  const description = stepDescriptions[activeStep] ?? '';

  // ---------------------------------------------------------------------------
  // Derived data for confirmation step
  // ---------------------------------------------------------------------------

  const selectedDrinkItem = wizard.availableDrinks.find(
    (d) => d.value === wizard.formData.selectedDrink,
  );

  const activeModifiers = Object.entries(wizard.formData.modifierState)
    .filter(([, active]) => active)
    .map(([key]) => resolveModifierDisplayLabel(key));

  // ---------------------------------------------------------------------------
  // Submit handler
  // ---------------------------------------------------------------------------

  function handleConfirm() {
    const value = buildEvDrinkOrderValue(wizard.formData);
    onSubmit(value);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <StepFlowShell
      currentStep={wizard.currentStep}
      totalSteps={wizard.totalSteps}
      title={title}
      description={description}
      onBack={wizard.currentStepIndex === 0 ? undefined : wizard.goBack}
    >
      {/* ── Step: Drink ── */}
      {activeStep === 'drink' && (
        <section className="space-y-3">
          <fieldset className="space-y-2">
            <legend className="sr-only">Select a drink</legend>
            {wizard.availableDrinks.map((drink) => (
              <label
                key={drink.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                  wizard.formData.selectedDrink === drink.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <input
                  type="radio"
                  name="ev-drink"
                  value={drink.value}
                  checked={wizard.formData.selectedDrink === drink.value}
                  onChange={() => wizard.updateField('selectedDrink', drink.value)}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">{drink.label}</span>
              </label>
            ))}
          </fieldset>

          <button
            type="button"
            disabled={!wizard.canAdvance}
            onClick={wizard.advanceStep}
            className="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Next
          </button>
        </section>
      )}

      {/* ── Step: Modifier ── */}
      {activeStep === 'modifier' && selectedDrinkItem?.modifiers && (
        <section className="space-y-3">
          <fieldset className="space-y-2">
            <legend className="sr-only">Customise your drink</legend>
            {Object.keys(selectedDrinkItem.modifiers).map((key) => (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                  wizard.formData.modifierState[key]
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card'
                }`}
              >
                <input
                  type="checkbox"
                  checked={wizard.formData.modifierState[key] ?? false}
                  onChange={(e) => wizard.updateModifier(key, e.target.checked)}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">
                  {resolveModifierDisplayLabel(key)}
                </span>
              </label>
            ))}
          </fieldset>

          <button
            type="button"
            onClick={wizard.advanceStep}
            className="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Next
          </button>
        </section>
      )}

      {/* ── Step: Time ── */}
      {activeStep === 'time' && (
        <section className="space-y-3">
          <div>
            <label htmlFor="ev-drink-time" className="sr-only">
              Delivery time
            </label>
            <select
              id="ev-drink-time"
              value={wizard.formData.selectedTime ?? ''}
              onChange={(e) =>
                wizard.updateField('selectedTime', e.target.value || null)
              }
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">Select a time…</option>
              {evDrinkTimes.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={!wizard.canAdvance}
            onClick={wizard.advanceStep}
            className="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Next
          </button>
        </section>
      )}

      {/* ── Step: Confirmation ── */}
      {activeStep === 'confirmation' && (
        <section className="space-y-4">
          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Drink
              </p>
              <p className="text-sm text-foreground">
                {wizard.formData.selectedDrinkLabel ?? '—'}
              </p>
            </div>

            {activeModifiers.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Extras
                </p>
                <p className="text-sm text-foreground">
                  {activeModifiers.join(', ')}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Delivery time
              </p>
              <p className="text-sm text-foreground">
                {wizard.formData.selectedTime ?? '—'}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => wizard.goToStep(0)}
              className="min-h-11 flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              Edit
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="min-h-11 flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting…' : 'Confirm order'}
            </button>
          </div>
        </section>
      )}
    </StepFlowShell>
  );
}
