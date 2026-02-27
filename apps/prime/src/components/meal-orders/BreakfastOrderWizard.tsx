/* eslint-disable ds/no-hardcoded-copy -- BRIK-2 meal-orders i18n deferred */
'use client';

import { useEffect } from 'react';

import { StepFlowShell } from '@acme/design-system/primitives';

import {
  breakfastOptions,
  breakfastTimes,
  drinksOptions,
  eggSides,
  eggStyles,
  milkOptions,
  pancakeSyrups,
  sugarOptions,
} from '@/config/meal-orders/menuData';
import { useBreakfastWizard } from '@/hooks/meal-orders/useBreakfastWizard';
import { buildBreakfastOrderValue } from '@/lib/meal-orders/buildOrderValue';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BreakfastOrderWizardProps {
  serviceDate: string;
  onSubmit: (value: string) => void;
  isSubmitting: boolean;
  onReset?: () => void;
}

// ---------------------------------------------------------------------------
// Step metadata
// ---------------------------------------------------------------------------

const STEP_META: Record<string, { title: string; description: string }> = {
  food: {
    title: 'Choose your breakfast',
    description: 'Select your main dish.',
  },
  eggs: {
    title: 'Egg style & sides',
    description: 'How would you like your eggs, and choose 3 sides.',
  },
  pancakes: {
    title: 'Pancake syrup',
    description: 'Choose your syrup.',
  },
  drinks: {
    title: 'Choose your drink',
    description: 'Select a drink to go with your breakfast.',
  },
  sugar: {
    title: 'Sugar',
    description: 'How much sugar would you like?',
  },
  milksugar: {
    title: 'Milk & Sugar',
    description: 'How would you like your drink?',
  },
  time: {
    title: 'Delivery time',
    description: 'When would you like your breakfast delivered?',
  },
  confirmation: {
    title: 'Confirm your order',
    description: 'Please review your order before submitting.',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BreakfastOrderWizard({
  serviceDate,
  onSubmit,
  isSubmitting,
}: BreakfastOrderWizardProps) {
  const wizard = useBreakfastWizard();

  useEffect(() => {
    wizard.resetWizard();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- BRIK-2 intentionally only depends on serviceDate
  }, [serviceDate]);

  const meta = STEP_META[wizard.activeStep] ?? STEP_META['food'];

  // -------------------------------------------------------------------------
  // Step content renderers
  // -------------------------------------------------------------------------

  function renderFoodStep() {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {breakfastOptions.map((item) => {
            const isSelected = wizard.formData.selectedFood === item.value;
            return (
              <label
                key={item.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <input
                  type="radio"
                  name="breakfast-food"
                  value={item.value}
                  checked={isSelected}
                  onChange={() => {
                    wizard.updateField('selectedFood', item.value);
                    wizard.updateField('selectedFoodLabel', item.label);
                  }}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">{item.label}</span>
              </label>
            );
          })}
        </div>
        <button
          type="button"
          disabled={!wizard.canAdvance}
          onClick={wizard.advanceStep}
          className="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  }

  function renderEggsStep() {
    const selectedSides = wizard.formData.selectedSides ?? [];
    const remaining = 3 - selectedSides.length;
    return (
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Egg style</p>
          <div className="space-y-2">
            {eggStyles.map((item) => {
              const isSelected = wizard.formData.selectedEggStyle === item.value;
              return (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  <input
                    type="radio"
                    name="egg-style"
                    value={item.value}
                    checked={isSelected}
                    onChange={() => wizard.updateField('selectedEggStyle', item.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">{item.label}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">
            Select 3 sides ({remaining} remaining)
          </p>
          <div className="space-y-2">
            {eggSides.map((item) => {
              const isSelected = selectedSides.includes(item.value);
              const isDisabled = !isSelected && remaining === 0;
              return (
                <label
                  key={item.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  } ${isDisabled ? 'opacity-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => {
                      const next = isSelected
                        ? selectedSides.filter((s) => s !== item.value)
                        : [...selectedSides, item.value];
                      wizard.updateField('selectedSides', next);
                    }}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">{item.label}</span>
                </label>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          disabled={!wizard.canAdvance}
          onClick={wizard.advanceStep}
          className="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  }

  function renderPancakesStep() {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {pancakeSyrups.map((item) => {
            const isSelected = wizard.formData.selectedSyrup === item.label;
            return (
              <label
                key={item.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <input
                  type="radio"
                  name="pancake-syrup"
                  value={item.value}
                  checked={isSelected}
                  onChange={() => wizard.updateField('selectedSyrup', item.label)}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">{item.label}</span>
              </label>
            );
          })}
        </div>
        <button
          type="button"
          disabled={!wizard.canAdvance}
          onClick={wizard.advanceStep}
          className="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  }

  function renderDrinksStep() {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {drinksOptions.map((item) => {
            const isSelected = wizard.formData.selectedDrink === item.value;
            return (
              <label
                key={item.value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <input
                  type="radio"
                  name="breakfast-drink"
                  value={item.value}
                  checked={isSelected}
                  onChange={() => {
                    wizard.updateField('selectedDrink', item.value);
                    wizard.updateField('selectedDrinkLabel', item.label);
                  }}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">{item.label}</span>
              </label>
            );
          })}
        </div>
        <button
          type="button"
          disabled={!wizard.canAdvance}
          onClick={wizard.advanceStep}
          className="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  }

  function renderSugarStep() {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          {sugarOptions.map((option) => {
            const isSelected = wizard.formData.selectedSugar === option;
            return (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <input
                  type="radio"
                  name="sugar"
                  value={option}
                  checked={isSelected}
                  onChange={() => wizard.updateField('selectedSugar', option)}
                  className="accent-primary"
                />
                <span className="text-sm text-foreground">{option}</span>
              </label>
            );
          })}
        </div>
        <button
          type="button"
          disabled={!wizard.canAdvance}
          onClick={wizard.advanceStep}
          className="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  }

  function renderMilkSugarStep() {
    return (
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Milk</p>
          <div className="space-y-2">
            {milkOptions.map((option) => {
              const isSelected = wizard.formData.selectedMilk === option;
              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  <input
                    type="radio"
                    name="milk"
                    value={option}
                    checked={isSelected}
                    onChange={() => wizard.updateField('selectedMilk', option)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">{option}</span>
                </label>
              );
            })}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Sugar</p>
          <div className="space-y-2">
            {sugarOptions.map((option) => {
              const isSelected = wizard.formData.selectedSugar === option;
              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  }`}
                >
                  <input
                    type="radio"
                    name="milksugar-sugar"
                    value={option}
                    checked={isSelected}
                    onChange={() => wizard.updateField('selectedSugar', option)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-foreground">{option}</span>
                </label>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          disabled={!wizard.canAdvance}
          onClick={wizard.advanceStep}
          className="mt-2 min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  }

  function renderTimeStep() {
    return (
      <div className="space-y-3">
        <div>
          <label
            htmlFor="breakfast-time"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Delivery time
          </label>
          <select
            id="breakfast-time"
            value={wizard.formData.selectedTime ?? ''}
            onChange={(e) => wizard.updateField('selectedTime', e.target.value || null)}
            className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="">Select a time…</option>
            {breakfastTimes.map((time) => (
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
      </div>
    );
  }

  function renderConfirmationStep() {
    const {
      selectedFood,
      selectedFoodLabel,
      selectedEggStyle,
      selectedSides,
      selectedSyrup,
      selectedDrinkLabel,
      selectedMilk,
      selectedSugar,
      selectedTime,
    } = wizard.formData;

    // Build food display string
    let foodDisplay = selectedFoodLabel ?? '';
    if (selectedFood === 'Eggs' && selectedEggStyle) {
      foodDisplay = `Eggs (${selectedEggStyle})`;
    } else if (selectedFood === 'Pancakes' && selectedSyrup) {
      foodDisplay = `Pancakes (${selectedSyrup})`;
    }

    // Build drink display string
    const drinkParts: string[] = [];
    if (selectedDrinkLabel) drinkParts.push(selectedDrinkLabel);
    if (selectedMilk) drinkParts.push(selectedMilk);
    if (selectedSugar) drinkParts.push(selectedSugar);
    const drinkDisplay = drinkParts.join(', ');

    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <dl className="space-y-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Food
              </dt>
              <dd className="mt-0.5 text-sm text-foreground">{foodDisplay}</dd>
            </div>
            {selectedFood === 'Eggs' && selectedSides.length > 0 && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Sides
                </dt>
                <dd className="mt-0.5 text-sm text-foreground">
                  {selectedSides.join(', ')}
                </dd>
              </div>
            )}
            {drinkDisplay && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Drink
                </dt>
                <dd className="mt-0.5 text-sm text-foreground">{drinkDisplay}</dd>
              </div>
            )}
            {selectedTime && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Delivery time
                </dt>
                <dd className="mt-0.5 text-sm text-foreground">{selectedTime}</dd>
              </div>
            )}
          </dl>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => wizard.goToStep(0)}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              const value = buildBreakfastOrderValue(wizard.formData);
              onSubmit(value);
            }}
            className="min-h-11 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting…' : 'Confirm order'}
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Step content dispatcher
  // -------------------------------------------------------------------------

  function renderStepContent() {
    switch (wizard.activeStep) {
      case 'food':
        return renderFoodStep();
      case 'eggs':
        return renderEggsStep();
      case 'pancakes':
        return renderPancakesStep();
      case 'drinks':
        return renderDrinksStep();
      case 'sugar':
        return renderSugarStep();
      case 'milksugar':
        return renderMilkSugarStep();
      case 'time':
        return renderTimeStep();
      case 'confirmation':
        return renderConfirmationStep();
      default:
        return null;
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <StepFlowShell
      currentStep={wizard.currentStep}
      totalSteps={wizard.totalSteps}
      title={meta.title}
      description={meta.description}
      onBack={wizard.currentStepIndex === 0 ? undefined : wizard.goBack}
    >
      {renderStepContent()}
    </StepFlowShell>
  );
}
