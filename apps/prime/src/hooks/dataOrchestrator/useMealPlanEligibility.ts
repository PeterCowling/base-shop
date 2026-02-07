/**
 * useMealPlanEligibility
 *
 * Computes meal plan eligibility and related display flags:
 * - Breakfast eligibility and types
 * - Drink eligibility and counts
 * - Display flags for UI components
 */

import { useMemo } from 'react';
import type { ProcessedPreorder } from './useOccupantTransform';

// Prepaid meal plan types
export const PREPAID_MEAL_PLANS = ['PREPAID_MP_A', 'PREPAID_MP_B', 'PREPAID_MP_C'] as const;
export type PrepaidMealPlan = typeof PREPAID_MEAL_PLANS[number];

export interface OccupantEligibility {
  isEligibleForComplimentaryBreakfast: boolean;
  isEligibleForEveningDrink: boolean;
}

export interface UseMealPlanEligibilityInput {
  preorders: ProcessedPreorder[];
  isCheckedIn: boolean;
}

export interface UseMealPlanEligibilityResult {
  // Meal plan types from first preorder
  occupantBreakfastType: string;
  occupantDrink1Type: string;
  occupantDrink2Type: string;

  // Display flags
  showOrderBreakfastLink: boolean;
  showBreakfastIncludedMessage: boolean;
  showOrderDrinkLinks: boolean;
  showDrinksIncludedMessage: boolean;

  // Drink allowance
  drinksAllowed: number;

  // Eligibility
  eligibility: OccupantEligibility;

  // Reference to meal plans
  prepaidMealPlans: readonly string[];
}

/**
 * Get the number of drinks allowed based on meal plan type
 */
function getDrinksAllowed(breakfastType: string): number {
  if (breakfastType === 'PREPAID_MP_C') return 2;
  if (['PREPAID_MP_A', 'PREPAID_MP_B'].includes(breakfastType)) return 1;
  return 0;
}

/**
 * Check if a preorder indicates breakfast eligibility
 */
function hasBreakfastEligibility(preorder: ProcessedPreorder): boolean {
  return !!preorder.breakfast && preorder.breakfast !== 'NA';
}

/**
 * Check if a preorder indicates drink eligibility
 */
function hasDrinkEligibility(preorder: ProcessedPreorder): boolean {
  return (
    (!!preorder.drink1 && preorder.drink1 !== 'NA') ||
    (!!preorder.drink2 && preorder.drink2 !== 'NA')
  );
}

export function useMealPlanEligibility(
  input: UseMealPlanEligibilityInput
): UseMealPlanEligibilityResult {
  const { preorders, isCheckedIn } = input;

  // Get meal types from first preorder
  const occupantBreakfastType = useMemo(() => {
    if (!preorders || preorders.length === 0) return '';
    return preorders[0]?.breakfast ?? '';
  }, [preorders]);

  const occupantDrink1Type = useMemo(() => {
    if (!preorders || preorders.length === 0) return '';
    return preorders[0]?.drink1 ?? '';
  }, [preorders]);

  const occupantDrink2Type = useMemo(() => {
    if (!preorders || preorders.length === 0) return '';
    return preorders[0]?.drink2 ?? '';
  }, [preorders]);

  // Calculate drinks allowed
  const drinksAllowed = useMemo(
    () => getDrinksAllowed(occupantBreakfastType),
    [occupantBreakfastType]
  );

  // Helper: is this a prepaid meal plan?
  const hasPrepaidMealPlan = useMemo(
    () => occupantBreakfastType !== '' && PREPAID_MEAL_PLANS.includes(occupantBreakfastType as PrepaidMealPlan),
    [occupantBreakfastType]
  );

  // Display flags for breakfast
  const showOrderBreakfastLink = useMemo(
    () => hasPrepaidMealPlan && isCheckedIn,
    [hasPrepaidMealPlan, isCheckedIn]
  );

  const showBreakfastIncludedMessage = useMemo(
    () => hasPrepaidMealPlan && !isCheckedIn,
    [hasPrepaidMealPlan, isCheckedIn]
  );

  // Display flags for drinks
  const showOrderDrinkLinks = useMemo(
    () => hasPrepaidMealPlan && isCheckedIn && drinksAllowed > 0,
    [hasPrepaidMealPlan, isCheckedIn, drinksAllowed]
  );

  const showDrinksIncludedMessage = useMemo(
    () => hasPrepaidMealPlan && !isCheckedIn && drinksAllowed > 0,
    [hasPrepaidMealPlan, isCheckedIn, drinksAllowed]
  );

  // Compute overall eligibility
  const eligibility = useMemo<OccupantEligibility>(() => {
    if (!preorders || preorders.length === 0) {
      return {
        isEligibleForComplimentaryBreakfast: false,
        isEligibleForEveningDrink: false,
      };
    }

    return {
      isEligibleForComplimentaryBreakfast: preorders.some(hasBreakfastEligibility),
      isEligibleForEveningDrink: preorders.some(hasDrinkEligibility),
    };
  }, [preorders]);

  return {
    occupantBreakfastType,
    occupantDrink1Type,
    occupantDrink2Type,
    showOrderBreakfastLink,
    showBreakfastIncludedMessage,
    showOrderDrinkLinks,
    showDrinksIncludedMessage,
    drinksAllowed,
    eligibility,
    prepaidMealPlans: PREPAID_MEAL_PLANS,
  };
}
