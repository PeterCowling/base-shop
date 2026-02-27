/* eslint-disable ds/no-hardcoded-copy -- BRIK-2 meal-orders wizard i18n deferred */
import { useCallback, useMemo, useState } from 'react';

import { type BreakfastWizardState } from '@/lib/meal-orders/buildOrderValue';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StepName =
  | 'food'
  | 'eggs'
  | 'pancakes'
  | 'drinks'
  | 'sugar'
  | 'milksugar'
  | 'time'
  | 'confirmation';

export type BreakfastFormData = BreakfastWizardState;

// ---------------------------------------------------------------------------
// Sub-step maps
// ---------------------------------------------------------------------------

const FOOD_SUBSTEP_MAP: Record<string, StepName[]> = {
  Eggs: ['eggs'],
  Pancakes: ['pancakes'],
};

const DRINK_SUBSTEP_MAP: Record<string, StepName[]> = {
  Cappuccino: ['sugar'],
  Americano: ['milksugar'],
  Espresso: ['sugar'],
  'Breakfast Tea': ['milksugar'],
};

// ---------------------------------------------------------------------------
// Base steps (always present)
// ---------------------------------------------------------------------------

const BASE_STEPS: StepName[] = ['food', 'drinks', 'time', 'confirmation'];

// ---------------------------------------------------------------------------
// Initial form data
// ---------------------------------------------------------------------------

const INITIAL_FORM_DATA: BreakfastFormData = {
  selectedFood: null,
  selectedFoodLabel: null,
  selectedEggStyle: null,
  selectedSides: [],
  selectedSyrup: null,
  selectedDrink: null,
  selectedDrinkLabel: null,
  selectedMilk: null,
  selectedSugar: null,
  selectedTime: null,
};

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface UseBreakfastWizardReturn {
  currentStepIndex: number;
  totalSteps: number;
  currentStep: number;
  formData: BreakfastFormData;
  updateField: <K extends keyof BreakfastFormData>(
    field: K,
    value: BreakfastFormData[K],
  ) => void;
  advanceStep: () => void;
  goBack: () => void;
  goToStep: (stepIndex: number) => void;
  canAdvance: boolean;
  isAtConfirmation: boolean;
  activeStep: StepName;
  resetWizard: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBreakfastWizard(): UseBreakfastWizardReturn {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState<BreakfastFormData>(INITIAL_FORM_DATA);

  // -------------------------------------------------------------------------
  // Derive active steps dynamically from current form data
  // -------------------------------------------------------------------------

  const activeSteps = useMemo<StepName[]>(() => {
    const steps: StepName[] = [];

    for (const base of BASE_STEPS) {
      steps.push(base);

      if (base === 'food' && formData.selectedFood !== null) {
        const foodSubs = FOOD_SUBSTEP_MAP[formData.selectedFood] ?? [];
        steps.push(...foodSubs);
      }

      if (base === 'drinks' && formData.selectedDrink !== null) {
        const drinkSubs = DRINK_SUBSTEP_MAP[formData.selectedDrink] ?? [];
        steps.push(...drinkSubs);
      }
    }

    return steps;
  }, [formData.selectedFood, formData.selectedDrink]);

  // -------------------------------------------------------------------------
  // canAdvance
  // -------------------------------------------------------------------------

  const canAdvance = useMemo<boolean>(() => {
    const stepName = activeSteps[currentStepIndex];
    switch (stepName) {
      case 'food':
        return !!formData.selectedFood;
      case 'eggs':
        return !!formData.selectedEggStyle && formData.selectedSides?.length === 3;
      case 'pancakes':
        return !!formData.selectedSyrup;
      case 'drinks':
        return !!formData.selectedDrink;
      case 'sugar':
        return !!formData.selectedSugar;
      case 'milksugar':
        return !!formData.selectedMilk && !!formData.selectedSugar;
      case 'time':
        return !!formData.selectedTime;
      case 'confirmation':
        return true;
      default:
        return false;
    }
  }, [
    activeSteps,
    currentStepIndex,
    formData.selectedFood,
    formData.selectedEggStyle,
    formData.selectedSides,
    formData.selectedSyrup,
    formData.selectedDrink,
    formData.selectedSugar,
    formData.selectedMilk,
    formData.selectedTime,
  ]);

  // -------------------------------------------------------------------------
  // isAtConfirmation
  // -------------------------------------------------------------------------

  const isAtConfirmation = currentStepIndex === activeSteps.length - 1;

  // -------------------------------------------------------------------------
  // updateField — with stale-field clearing on food/drink changes
  // -------------------------------------------------------------------------

  const updateField = useCallback(
    <K extends keyof BreakfastFormData>(field: K, value: BreakfastFormData[K]): void => {
      setFormData((prev) => {
        const next: BreakfastFormData = { ...prev, [field]: value };

        if (field === 'selectedFood') {
          // Clear stale food sub-step fields whenever food selection changes
          next.selectedEggStyle = null;
          next.selectedSides = [];
          next.selectedSyrup = null;
        }

        if (field === 'selectedDrink') {
          // Clear stale drink sub-step fields whenever drink selection changes
          next.selectedMilk = null;
          next.selectedSugar = null;
        }

        return next;
      });
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  const advanceStep = useCallback((): void => {
    setCurrentStepIndex((prev) => {
      if (prev < activeSteps.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, [activeSteps.length]);

  const goBack = useCallback((): void => {
    setCurrentStepIndex((prev) => {
      if (prev > 0) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  const goToStep = useCallback((stepIndex: number): void => {
    setCurrentStepIndex(stepIndex);
  }, []);

  // -------------------------------------------------------------------------
  // resetWizard
  // -------------------------------------------------------------------------

  const resetWizard = useCallback((): void => {
    setFormData(INITIAL_FORM_DATA);
    setCurrentStepIndex(0);
  }, []);

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    currentStepIndex,
    totalSteps: activeSteps.length,
    currentStep: currentStepIndex + 1,
    formData,
    updateField,
    advanceStep,
    goBack,
    goToStep,
    canAdvance,
    isAtConfirmation,
    activeStep: activeSteps[currentStepIndex] ?? 'food',
    resetWizard,
  };
}
