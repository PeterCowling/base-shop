/* eslint-disable ds/min-tap-size -- BRIK-2 meal-orders tap size deferred */
'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { StepFlowShell } from '@acme/design-system/primitives';

import { evDrinkTimes } from '@/config/meal-orders/menuData';
import type { GuestBookingSnapshot } from '@/hooks/dataOrchestrator/useGuestBookingSnapshot';
import { useEvDrinkWizard } from '@/hooks/meal-orders/useEvDrinkWizard';
import { buildEvDrinkOrderValue } from '@/lib/meal-orders/buildOrderValue';

// ---------------------------------------------------------------------------
// Modifier label key map (for i18n lookup)
// ---------------------------------------------------------------------------

const MODIFIER_I18N_KEYS: Record<string, string> = {
  milk: 'evDrinkWizard.modifiers.withMilk',
  sugar: 'evDrinkWizard.modifiers.withSugar',
  sweetened: 'evDrinkWizard.modifiers.sweetened',
};

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
  const { t } = useTranslation('Homepage');
  const wizard = useEvDrinkWizard({ preorders, serviceDate });

  // Reset wizard when the service date changes (e.g. user picks a different night)
  useEffect(() => {
    wizard.resetWizard();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- BRIK-2 intentionally only depends on serviceDate
  }, [serviceDate]);

  const { activeStep } = wizard;
  const stepKeys = ['drink', 'modifier', 'time', 'confirmation'] as const;
  const safeStep = stepKeys.includes(activeStep as typeof stepKeys[number]) ? activeStep : 'drink';
  const title = t(`evDrinkWizard.steps.${safeStep}.title`);
  const description = t(`evDrinkWizard.steps.${safeStep}.description`);

  // ---------------------------------------------------------------------------
  // Derived data for confirmation step
  // ---------------------------------------------------------------------------

  const selectedDrinkItem = wizard.availableDrinks.find(
    (d) => d.value === wizard.formData.selectedDrink,
  );

  const activeModifiers = Object.entries(wizard.formData.modifierState)
    .filter(([, active]) => active)
    .map(([key]) => {
      const i18nKey = MODIFIER_I18N_KEYS[key];
      if (i18nKey) return t(i18nKey);
      const capitalised = key.charAt(0).toUpperCase() + key.slice(1);
      return t('evDrinkWizard.modifiers.withGeneric', { name: capitalised });
    });

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
            <legend className="sr-only">{t('evDrinkWizard.selectDrinkLegend')}</legend>
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
            {t('evDrinkWizard.next')}
          </button>
        </section>
      )}

      {/* ── Step: Modifier ── */}
      {activeStep === 'modifier' && selectedDrinkItem?.modifiers && (
        <section className="space-y-3">
          <fieldset className="space-y-2">
            <legend className="sr-only">{t('evDrinkWizard.customiseLegend')}</legend>
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
                  {MODIFIER_I18N_KEYS[key] ? t(MODIFIER_I18N_KEYS[key]) : t('evDrinkWizard.modifiers.withGeneric', { name: key.charAt(0).toUpperCase() + key.slice(1) })}
                </span>
              </label>
            ))}
          </fieldset>

          <button
            type="button"
            onClick={wizard.advanceStep}
            className="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            {t('evDrinkWizard.next')}
          </button>
        </section>
      )}

      {/* ── Step: Time ── */}
      {activeStep === 'time' && (
        <section className="space-y-3">
          <div>
            <label htmlFor="ev-drink-time" className="sr-only">
              {t('evDrinkWizard.deliveryTimeSrLabel')}
            </label>
            <select
              id="ev-drink-time"
              value={wizard.formData.selectedTime ?? ''}
              onChange={(e) =>
                wizard.updateField('selectedTime', e.target.value || null)
              }
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <option value="">{t('evDrinkWizard.selectTime')}</option>
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
            {t('evDrinkWizard.next')}
          </button>
        </section>
      )}

      {/* ── Step: Confirmation ── */}
      {activeStep === 'confirmation' && (
        <section className="space-y-4">
          <div className="space-y-2 rounded-lg border border-border bg-card p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('evDrinkWizard.confirmDrink')}
              </p>
              <p className="text-sm text-foreground">
                {wizard.formData.selectedDrinkLabel ?? '—'}
              </p>
            </div>

            {activeModifiers.length > 0 && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('evDrinkWizard.confirmExtras')}
                </p>
                <p className="text-sm text-foreground">
                  {activeModifiers.join(', ')}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('evDrinkWizard.confirmDeliveryTime')}
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
              {t('evDrinkWizard.edit')}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirm}
              className="min-h-11 flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {isSubmitting ? t('evDrinkWizard.submitting') : t('evDrinkWizard.confirmOrder')}
            </button>
          </div>
        </section>
      )}
    </StepFlowShell>
  );
}
