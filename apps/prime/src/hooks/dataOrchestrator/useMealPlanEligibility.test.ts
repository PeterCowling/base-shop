import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ProcessedPreorder } from './useOccupantTransform';
import { PREPAID_MEAL_PLANS, useMealPlanEligibility } from './useMealPlanEligibility';

describe('useMealPlanEligibility', () => {
  const createPreorder = (
    breakfast: string,
    drink1 = 'NA',
    drink2 = 'NA'
  ): ProcessedPreorder => ({
    id: 'test-1',
    night: 'Night1',
    breakfast,
    drink1,
    drink2,
  });

  describe('meal plan types', () => {
    it('extracts breakfast type from first preorder', () => {
      const preorders = [createPreorder('PREPAID_MP_A')];
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders, isCheckedIn: true })
      );

      expect(result.current.occupantBreakfastType).toBe('PREPAID_MP_A');
    });

    it('extracts drink types from first preorder', () => {
      const preorders = [createPreorder('PREPAID_MP_B', 'COFFEE', 'TEA')];
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders, isCheckedIn: true })
      );

      expect(result.current.occupantDrink1Type).toBe('COFFEE');
      expect(result.current.occupantDrink2Type).toBe('TEA');
    });

    it('returns empty strings when no preorders', () => {
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders: [], isCheckedIn: true })
      );

      expect(result.current.occupantBreakfastType).toBe('');
      expect(result.current.occupantDrink1Type).toBe('');
      expect(result.current.occupantDrink2Type).toBe('');
    });
  });

  describe('drinks allowed', () => {
    it('allows 2 drinks for PREPAID_MP_C', () => {
      const preorders = [createPreorder('PREPAID_MP_C')];
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders, isCheckedIn: true })
      );

      expect(result.current.drinksAllowed).toBe(2);
    });

    it('allows 1 drink for PREPAID_MP_A', () => {
      const preorders = [createPreorder('PREPAID_MP_A')];
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders, isCheckedIn: true })
      );

      expect(result.current.drinksAllowed).toBe(1);
    });

    it('allows 1 drink for PREPAID_MP_B', () => {
      const preorders = [createPreorder('PREPAID_MP_B')];
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders, isCheckedIn: true })
      );

      expect(result.current.drinksAllowed).toBe(1);
    });

    it('allows 0 drinks for non-prepaid plans', () => {
      const preorders = [createPreorder('STANDARD')];
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders, isCheckedIn: true })
      );

      expect(result.current.drinksAllowed).toBe(0);
    });
  });

  describe('display flags when checked in', () => {
    it('shows order breakfast link when checked in with prepaid plan', () => {
      const preorders = [createPreorder('PREPAID_MP_A')];
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders, isCheckedIn: true })
      );

      expect(result.current.showOrderBreakfastLink).toBe(true);
      expect(result.current.showBreakfastIncludedMessage).toBe(false);
    });

    it('shows order drink links when checked in with drinks allowed', () => {
      const preorders = [createPreorder('PREPAID_MP_B')];
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders, isCheckedIn: true })
      );

      expect(result.current.showOrderDrinkLinks).toBe(true);
      expect(result.current.showDrinksIncludedMessage).toBe(false);
    });
  });

  describe('display flags when not checked in', () => {
    it('shows breakfast included message when not checked in with prepaid plan', () => {
      const preorders = [createPreorder('PREPAID_MP_A')];
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders, isCheckedIn: false })
      );

      expect(result.current.showOrderBreakfastLink).toBe(false);
      expect(result.current.showBreakfastIncludedMessage).toBe(true);
    });

    it('shows drinks included message when not checked in with drinks allowed', () => {
      const preorders = [createPreorder('PREPAID_MP_B')];
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders, isCheckedIn: false })
      );

      expect(result.current.showOrderDrinkLinks).toBe(false);
      expect(result.current.showDrinksIncludedMessage).toBe(true);
    });
  });

  describe('eligibility', () => {
    it('is eligible for breakfast when preorder has non-NA breakfast', () => {
      const preorders = [createPreorder('PREPAID_MP_A')];
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders, isCheckedIn: true })
      );

      expect(result.current.eligibility.isEligibleForComplimentaryBreakfast).toBe(true);
    });

    it('is not eligible for breakfast when all preorders have NA', () => {
      const preorders = [createPreorder('NA')];
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders, isCheckedIn: true })
      );

      expect(result.current.eligibility.isEligibleForComplimentaryBreakfast).toBe(false);
    });

    it('is eligible for drinks when preorder has non-NA drink', () => {
      const preorders = [createPreorder('PREPAID_MP_A', 'COFFEE', 'NA')];
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders, isCheckedIn: true })
      );

      expect(result.current.eligibility.isEligibleForEveningDrink).toBe(true);
    });

    it('is not eligible for drinks when all drinks are NA', () => {
      const preorders = [createPreorder('PREPAID_MP_A', 'NA', 'NA')];
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders, isCheckedIn: true })
      );

      expect(result.current.eligibility.isEligibleForEveningDrink).toBe(false);
    });

    it('returns no eligibility when no preorders', () => {
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders: [], isCheckedIn: true })
      );

      expect(result.current.eligibility).toEqual({
        isEligibleForComplimentaryBreakfast: false,
        isEligibleForEveningDrink: false,
      });
    });
  });

  describe('prepaidMealPlans constant', () => {
    it('exports prepaid meal plans', () => {
      expect(PREPAID_MEAL_PLANS).toEqual(['PREPAID_MP_A', 'PREPAID_MP_B', 'PREPAID_MP_C']);
    });

    it('returns prepaidMealPlans from hook', () => {
      const { result } = renderHook(() =>
        useMealPlanEligibility({ preorders: [], isCheckedIn: false })
      );

      expect(result.current.prepaidMealPlans).toEqual(PREPAID_MEAL_PLANS);
    });
  });
});
