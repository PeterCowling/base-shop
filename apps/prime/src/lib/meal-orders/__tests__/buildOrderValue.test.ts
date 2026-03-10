import "@testing-library/jest-dom";

import {
  type BreakfastWizardState,
  buildBreakfastOrderValue,
  buildEvDrinkOrderValue,
  type EvDrinkWizardState,
} from "../buildOrderValue";

// ---------------------------------------------------------------------------
// buildBreakfastOrderValue
// ---------------------------------------------------------------------------

describe("buildBreakfastOrderValue", () => {
  it("TC-01: Eggs + Scrambled + [Bacon, Ham, Toast] + Americano + Oat Milk + No Sugar + 09:00", () => {
    const state: BreakfastWizardState = {
      selectedFood: "Eggs",
      selectedFoodLabel: "Eggs with three sides",
      selectedEggStyle: "Scrambled",
      selectedSides: ["Bacon", "Ham", "Toast"],
      selectedSyrup: null,
      selectedDrink: "Americano",
      selectedDrinkLabel: "Americano",
      selectedMilk: "Oat Milk",
      selectedSugar: "No Sugar",
      selectedTime: "09:00",
    };

    expect(buildBreakfastOrderValue(state)).toBe(
      "Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00",
    );
  });

  it("TC-02: Pancakes + Nutella Chocolate Sauce + Green Tea + 08:30", () => {
    const state: BreakfastWizardState = {
      selectedFood: "Pancakes",
      selectedFoodLabel: "Pancakes",
      selectedEggStyle: null,
      selectedSides: [],
      selectedSyrup: "Nutella Chocolate Sauce",
      selectedDrink: "Green Tea",
      selectedDrinkLabel: "Green Tea",
      selectedMilk: null,
      selectedSugar: null,
      selectedTime: "08:30",
    };

    expect(buildBreakfastOrderValue(state)).toBe(
      "Pancakes (Nutella Chocolate Sauce) | Green Tea | 08:30",
    );
  });

  it("TC-03: Veggie Toast uses selectedFoodLabel directly (no egg style, no sides segment)", () => {
    // Veggie Toast is a non-Eggs, non-Pancakes food, so the label is used verbatim
    const state: BreakfastWizardState = {
      selectedFood: "Veggie Toast",
      selectedFoodLabel: "Veggie Toast (with seasonal vegetables)",
      selectedEggStyle: null,
      selectedSides: [],
      selectedSyrup: null,
      selectedDrink: "Carton OJ",
      selectedDrinkLabel: "Orange Juice (from the carton)",
      selectedMilk: null,
      selectedSugar: null,
      selectedTime: "10:00",
    };

    expect(buildBreakfastOrderValue(state)).toBe(
      "Veggie Toast (with seasonal vegetables) | Orange Juice (from the carton) | 10:00",
    );
  });

  it("TC-03b: sides are NOT emitted for non-Eggs food even if selectedSides is populated", () => {
    // Guard against regression: sides segment is gated on food === 'Eggs'
    const state: BreakfastWizardState = {
      selectedFood: "Pancakes",
      selectedFoodLabel: "Pancakes",
      selectedEggStyle: null,
      selectedSides: ["Bacon", "Ham", "Toast"], // should be ignored for Pancakes
      selectedSyrup: "Homemade Golden Syrup",
      selectedDrink: "Green Tea",
      selectedDrinkLabel: "Green Tea",
      selectedMilk: null,
      selectedSugar: null,
      selectedTime: "08:00",
    };

    expect(buildBreakfastOrderValue(state)).toBe(
      "Pancakes (Homemade Golden Syrup) | Green Tea | 08:00",
    );
  });

  it("TC-04: sides are sorted alphabetically", () => {
    // Pass sides out of alphabetical order; output should be sorted
    const state: BreakfastWizardState = {
      selectedFood: "Eggs",
      selectedFoodLabel: "Eggs with three sides",
      selectedEggStyle: "Omelette",
      selectedSides: ["Toast", "Bacon", "Ham"], // out of order
      selectedSyrup: null,
      selectedDrink: "Green Tea",
      selectedDrinkLabel: "Green Tea",
      selectedMilk: null,
      selectedSugar: null,
      selectedTime: "09:00",
    };

    // Sorted: Bacon, Ham, Toast
    expect(buildBreakfastOrderValue(state)).toBe(
      "Eggs (Omelette) | Bacon, Ham, Toast | Green Tea | 09:00",
    );
  });

  it("TC-05: null segments are filtered — no food, no drink, only time", () => {
    const state: BreakfastWizardState = {
      selectedFood: null,
      selectedFoodLabel: null,
      selectedEggStyle: null,
      selectedSides: [],
      selectedSyrup: null,
      selectedDrink: null,
      selectedDrinkLabel: null,
      selectedMilk: null,
      selectedSugar: null,
      selectedTime: "09:00",
    };

    expect(buildBreakfastOrderValue(state)).toBe("09:00");
  });
});

// ---------------------------------------------------------------------------
// buildEvDrinkOrderValue
// ---------------------------------------------------------------------------

describe("buildEvDrinkOrderValue", () => {
  it("TC-04: Aperol Spritz with no modifiers + 19:30", () => {
    const state: EvDrinkWizardState = {
      selectedDrink: "Aperol Spritz",
      selectedDrinkLabel: "Aperol Spritz",
      modifierState: {},
      selectedTime: "19:30",
    };

    expect(buildEvDrinkOrderValue(state)).toBe("Aperol Spritz | 19:30");
  });

  it("TC-05: Americano + milk on + sugar on + 19:00", () => {
    const state: EvDrinkWizardState = {
      selectedDrink: "Americano",
      selectedDrinkLabel: "Americano",
      modifierState: { milk: true, sugar: true },
      selectedTime: "19:00",
    };

    expect(buildEvDrinkOrderValue(state)).toBe(
      "Americano, With Milk, With Sugar | 19:00",
    );
  });

  it("inactive modifiers (false values) are omitted from the output", () => {
    const state: EvDrinkWizardState = {
      selectedDrink: "Americano",
      selectedDrinkLabel: "Americano",
      modifierState: { milk: false, sugar: true },
      selectedTime: "19:00",
    };

    expect(buildEvDrinkOrderValue(state)).toBe("Americano, With Sugar | 19:00");
  });

  it("sweetened modifier uses its own label without 'With' prefix", () => {
    const state: EvDrinkWizardState = {
      selectedDrink: "Iced Latte",
      selectedDrinkLabel: "Iced Latte",
      modifierState: { sweetened: true },
      selectedTime: "19:00",
    };

    expect(buildEvDrinkOrderValue(state)).toBe("Iced Latte, Sweetened | 19:00");
  });

  it("unknown modifier keys fall back to capitalise-and-prefix rule", () => {
    const state: EvDrinkWizardState = {
      selectedDrink: "Coke",
      selectedDrinkLabel: "Coke",
      modifierState: { sparkling: true },
      selectedTime: "18:00",
    };

    expect(buildEvDrinkOrderValue(state)).toBe("Coke, With Sparkling | 18:00");
  });

  it("empty state returns empty string", () => {
    const state: EvDrinkWizardState = {
      selectedDrink: null,
      selectedDrinkLabel: null,
      modifierState: {},
      selectedTime: null,
    };

    expect(buildEvDrinkOrderValue(state)).toBe("");
  });
});
