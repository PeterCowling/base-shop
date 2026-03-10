import { useCallback, useMemo, useState } from 'react';

import type { EvDrinkItem } from '@/config/meal-orders/menuData';
import { drinksData } from '@/config/meal-orders/menuData';
import type { GuestBookingSnapshot } from '@/hooks/dataOrchestrator/useGuestBookingSnapshot';
import type { EvDrinkWizardState } from '@/lib/meal-orders/buildOrderValue';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DrinkTier = 'type1' | 'all';

type WizardStep = 'drink' | 'modifier' | 'time' | 'confirmation';

const ALL_STEPS: WizardStep[] = ['drink', 'modifier', 'time', 'confirmation'];

export interface UseEvDrinkWizardReturn {
  /** 1-based index of the current step (for display) */
  currentStep: number;
  /** Total number of active steps */
  totalSteps: number;
  /** 0-based index into the activeSteps array */
  currentStepIndex: number;
  /** The current step name */
  activeStep: WizardStep;
  /** Current form state */
  formData: EvDrinkWizardState;
  /** Update a top-level field in formData */
  updateField: (field: keyof EvDrinkWizardState, value: unknown) => void;
  /** Update a single boolean modifier toggle */
  updateModifier: (key: string, value: boolean) => void;
  /** Move to the next step (no-op if already at last step) */
  advanceStep: () => void;
  /** Move to the previous step (no-op if already at first step) */
  goBack: () => void;
  /** Jump to any step by 0-based index */
  goToStep: (index: number) => void;
  /** Whether the wizard can advance from the current step */
  canAdvance: boolean;
  /** Whether the wizard is showing the confirmation step */
  isAtConfirmation: boolean;
  /** Reset the wizard back to step 0 with empty formData */
  resetWizard: () => void;
  /** Drinks filtered by the detected tier */
  availableDrinks: EvDrinkItem[];
}

// ---------------------------------------------------------------------------
// detectDrinkTier (exported for use in tests and sibling components)
// ---------------------------------------------------------------------------

export function detectDrinkTier(
  preorders: GuestBookingSnapshot['preorders'],
  serviceDate: string,
): DrinkTier {
  const night = Object.values(preorders).find(
    (n) => (n.serviceDate ?? n.night) === serviceDate,
  );
  if (!night) return 'type1';
  const code = (night.drink1 ?? '').replace(/_/g, ' ').trim().toUpperCase();
  if (code === 'PREPAID MP B' || code === 'PREPAID MP C') return 'all';
  return 'type1';
}

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

function initialFormData(): EvDrinkWizardState {
  return {
    selectedDrink: null,
    selectedDrinkLabel: null,
    modifierState: {},
    selectedTime: null,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useEvDrinkWizard({
  preorders,
  serviceDate,
}: {
  preorders: GuestBookingSnapshot['preorders'];
  serviceDate: string;
}): UseEvDrinkWizardReturn {
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState<EvDrinkWizardState>(initialFormData);

  // Drinks filtered by tier
  const availableDrinks = useMemo<EvDrinkItem[]>(() => {
    const tier = detectDrinkTier(preorders, serviceDate);
    if (tier === 'all') return drinksData;
    return drinksData.filter((d) => d.type === 'type 1');
  }, [preorders, serviceDate]);

  // The selected drink item (for modifier lookup)
  const selectedDrinkItem = useMemo<EvDrinkItem | undefined>(() => {
    if (!formData.selectedDrink) return undefined;
    return availableDrinks.find((d) => d.value === formData.selectedDrink);
  }, [formData.selectedDrink, availableDrinks]);

  // Active steps — modifier step only included when the selected drink has modifiers
  const activeSteps = useMemo<WizardStep[]>(() => {
    const hasModifiers =
      selectedDrinkItem?.modifiers !== undefined &&
      Object.keys(selectedDrinkItem.modifiers).length > 0;

    return ALL_STEPS.filter((step) => {
      if (step === 'modifier') return hasModifiers;
      return true;
    });
  }, [selectedDrinkItem]);

  const totalSteps = activeSteps.length;
  const currentStepIndex = Math.min(stepIndex, totalSteps - 1);
  const activeStep = activeSteps[currentStepIndex];

  // canAdvance per step
  const canAdvance = useMemo<boolean>(() => {
    switch (activeStep) {
      case 'drink':
        return !!formData.selectedDrink;
      case 'modifier':
        return true;
      case 'time':
        return !!formData.selectedTime;
      case 'confirmation':
        return true;
      default:
        return false;
    }
  }, [activeStep, formData.selectedDrink, formData.selectedTime]);

  const isAtConfirmation = activeStep === 'confirmation';

  // updateField — when selectedDrink changes, reset modifierState
  const updateField = useCallback(
    (field: keyof EvDrinkWizardState, value: unknown) => {
      setFormData((prev) => {
        if (field === 'selectedDrink') {
          const drinkValue = value as string | null;
          const drinkItem = drinkValue
            ? drinksData.find((d) => d.value === drinkValue)
            : undefined;
          const drinkLabel = drinkItem?.label ?? null;
          const freshModifiers: Record<string, boolean> = drinkItem?.modifiers
            ? { ...drinkItem.modifiers }
            : {};
          return {
            ...prev,
            selectedDrink: drinkValue,
            selectedDrinkLabel: drinkLabel,
            modifierState: freshModifiers,
          };
        }
        return { ...prev, [field]: value };
      });
    },
    [],
  );

  // updateModifier — targeted helper for boolean checkbox toggles
  const updateModifier = useCallback((key: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      modifierState: { ...prev.modifierState, [key]: value },
    }));
  }, []);

  const advanceStep = useCallback(() => {
    setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const goBack = useCallback(() => {
    setStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((index: number) => {
    setStepIndex(index);
  }, []);

  const resetWizard = useCallback(() => {
    setStepIndex(0);
    setFormData(initialFormData());
  }, []);

  return {
    currentStep: currentStepIndex + 1,
    totalSteps,
    currentStepIndex,
    activeStep,
    formData,
    updateField,
    updateModifier,
    advanceStep,
    goBack,
    goToStep,
    canAdvance,
    isAtConfirmation,
    resetWizard,
    availableDrinks,
  };
}
