/**
 * Pure functions that assemble human-readable order value strings from wizard
 * state. These strings are submitted verbatim to POST /api/firebase/preorders
 * as the `value` field.
 *
 * No React imports. No side effects.
 */

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface BreakfastWizardState {
  /** Food value field e.g. 'Eggs', 'Pancakes', 'FT Regular' */
  selectedFood: string | null;
  /** Food display label e.g. 'French Toast with Golden Syrup' */
  selectedFoodLabel: string | null;
  /** Egg style label e.g. 'Scrambled', 'Over-easy' (only for Eggs food) */
  selectedEggStyle: string | null;
  /** Side value array — exactly 3 entries when the order is complete */
  selectedSides: string[];
  /** Pancake syrup label e.g. 'Homemade Golden Syrup' (only for Pancakes food) */
  selectedSyrup: string | null;
  /** Drink value e.g. 'Americano' */
  selectedDrink: string | null;
  /** Drink display label e.g. 'Americano' */
  selectedDrinkLabel: string | null;
  /** Milk modifier label e.g. 'No Milk', 'Oat Milk', 'Full Milk' */
  selectedMilk: string | null;
  /** Sugar modifier label e.g. 'No Sugar', 'Half Sugar', 'Full Sugar' */
  selectedSugar: string | null;
  /** Desired delivery time e.g. '09:00' */
  selectedTime: string | null;
}

export interface EvDrinkWizardState {
  /** Drink value e.g. 'Aperol Spritz' */
  selectedDrink: string | null;
  /** Drink display label e.g. 'Aperol Spritz' */
  selectedDrinkLabel: string | null;
  /** Boolean toggle map e.g. { milk: true, sugar: false, sweetened: true } */
  modifierState: Record<string, boolean>;
  /** Desired delivery time e.g. '19:30' */
  selectedTime: string | null;
}

// ---------------------------------------------------------------------------
// Modifier label map for evening drink modifiers
// ---------------------------------------------------------------------------

/**
 * Maps a modifier key to its display label.
 *
 * Keys that are already adjectives (past-participle '-ed') are rendered
 * without the "With" prefix. All other keys get "With " prepended.
 *
 * Unknown keys fall back to the capitalise-and-prefix rule so new
 * modifiers degrade gracefully.
 */
const MODIFIER_LABELS: Record<string, string> = {
  milk: 'With Milk',
  sugar: 'With Sugar',
  sweetened: 'Sweetened',
};

function resolveModifierLabel(key: string): string {
  if (key in MODIFIER_LABELS) {
    return MODIFIER_LABELS[key];
  }
  const capitalised = key.charAt(0).toUpperCase() + key.slice(1);
  return `With ${capitalised}`;
}

// ---------------------------------------------------------------------------
// buildBreakfastOrderValue
// ---------------------------------------------------------------------------

/**
 * Assembles a pipe-delimited breakfast order string from wizard state.
 *
 * Segment order:
 *   1. Food  — "Eggs (EggStyle)" | "Pancakes (SyrupLabel)" | food label
 *   2. Sides — sorted side values joined with ", " (Eggs only)
 *   3. Drink — drink label + optional milk + optional sugar
 *   4. Time  — e.g. "09:00"
 *
 * Null/empty segments are filtered before joining with " | ".
 *
 * @example
 * // Eggs + Scrambled + [Bacon, Ham, Toast] + Americano/OatMilk/NoSugar + 09:00
 * // → "Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00"
 *
 * @example
 * // Pancakes + Nutella Chocolate Sauce + Green Tea + 08:30
 * // → "Pancakes (Nutella Chocolate Sauce) | Green Tea | 08:30"
 *
 * @example
 * // Veggie Toast + Orange Juice (from the carton) + 10:00
 * // → "Veggie Toast | Orange Juice (from the carton) | 10:00"
 */
export function buildBreakfastOrderValue(state: BreakfastWizardState): string {
  const segments: string[] = [];

  // --- Segment 1: Food ---
  const food = state.selectedFood;
  if (food) {
    if (food === 'Eggs') {
      const eggStyle = state.selectedEggStyle ?? '';
      segments.push(eggStyle ? `Eggs (${eggStyle})` : 'Eggs');
    } else if (food === 'Pancakes') {
      const syrup = state.selectedSyrup ?? '';
      segments.push(syrup ? `Pancakes (${syrup})` : 'Pancakes');
    } else {
      // For any other food, use the display label (not the value key)
      const foodLabel = state.selectedFoodLabel ?? food;
      segments.push(foodLabel);
    }
  }

  // --- Segment 2: Sides (Eggs only, sorted alphabetically) ---
  if (food === 'Eggs' && state.selectedSides.length > 0) {
    const sortedSides = [...state.selectedSides].sort((a, b) =>
      a.localeCompare(b),
    );
    segments.push(sortedSides.join(', '));
  }

  // --- Segment 3: Drink + modifiers ---
  const drinkLabel = state.selectedDrinkLabel;
  if (drinkLabel) {
    const drinkParts: string[] = [drinkLabel];
    // Milk comes before sugar in the output string
    if (state.selectedMilk) {
      drinkParts.push(state.selectedMilk);
    }
    if (state.selectedSugar) {
      drinkParts.push(state.selectedSugar);
    }
    segments.push(drinkParts.join(', '));
  }

  // --- Segment 4: Time ---
  if (state.selectedTime) {
    segments.push(state.selectedTime);
  }

  return segments.join(' | ');
}

// ---------------------------------------------------------------------------
// buildEvDrinkOrderValue
// ---------------------------------------------------------------------------

/**
 * Assembles a pipe-delimited evening drink order string from wizard state.
 *
 * Segment order:
 *   1. Drink + active modifiers (boolean true entries from modifierState)
 *   2. Time
 *
 * Modifier key iteration order follows insertion order of modifierState.
 * Null/empty segments are filtered before joining with " | ".
 *
 * @example
 * // Aperol Spritz, no modifiers, 19:30
 * // → "Aperol Spritz | 19:30"
 *
 * @example
 * // Americano + { milk: true, sugar: true } + 19:00
 * // → "Americano, With Milk, With Sugar | 19:00"
 *
 * @example
 * // Iced Latte + { sweetened: true } + 19:00
 * // → "Iced Latte, Sweetened | 19:00"
 */
export function buildEvDrinkOrderValue(state: EvDrinkWizardState): string {
  const segments: string[] = [];

  // --- Segment 1: Drink + active modifiers ---
  const drinkLabel = state.selectedDrinkLabel;
  if (drinkLabel) {
    const drinkParts: string[] = [drinkLabel];
    for (const [key, active] of Object.entries(state.modifierState)) {
      if (active) {
        drinkParts.push(resolveModifierLabel(key));
      }
    }
    segments.push(drinkParts.join(', '));
  }

  // --- Segment 2: Time ---
  if (state.selectedTime) {
    segments.push(state.selectedTime);
  }

  return segments.join(' | ');
}
