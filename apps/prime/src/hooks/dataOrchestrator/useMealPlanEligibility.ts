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

  return useMemo<UseMealPlanEligibilityResult>(() => {
    const first = preorders?.[0];
    const occupantBreakfastType = first?.breakfast ?? '';
    const occupantDrink1Type = first?.drink1 ?? '';
    const occupantDrink2Type = first?.drink2 ?? '';

    const drinksAllowed = getDrinksAllowed(occupantBreakfastType);
    const hasPrepaidMealPlan =
      occupantBreakfastType !== '' &&
      PREPAID_MEAL_PLANS.includes(occupantBreakfastType as PrepaidMealPlan);

    const eligibility: OccupantEligibility =
      preorders && preorders.length > 0
        ? {
            isEligibleForComplimentaryBreakfast: preorders.some(hasBreakfastEligibility),
            isEligibleForEveningDrink: preorders.some(hasDrinkEligibility),
          }
        : { isEligibleForComplimentaryBreakfast: false, isEligibleForEveningDrink: false };

    return {
      occupantBreakfastType,
      occupantDrink1Type,
      occupantDrink2Type,
      drinksAllowed,
      eligibility,
      showOrderBreakfastLink: hasPrepaidMealPlan && isCheckedIn,
      showBreakfastIncludedMessage: hasPrepaidMealPlan && !isCheckedIn,
      showOrderDrinkLinks: hasPrepaidMealPlan && isCheckedIn && drinksAllowed > 0,
      showDrinksIncludedMessage: hasPrepaidMealPlan && !isCheckedIn && drinksAllowed > 0,
      prepaidMealPlans: PREPAID_MEAL_PLANS,
    };
  }, [preorders, isCheckedIn]);
}
