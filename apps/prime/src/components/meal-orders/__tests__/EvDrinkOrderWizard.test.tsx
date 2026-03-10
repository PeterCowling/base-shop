 
import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { detectDrinkTier } from "@/hooks/meal-orders/useEvDrinkWizard";

import EvDrinkOrderWizard from "../EvDrinkOrderWizard";

// ---------------------------------------------------------------------------
// Mock @acme/design-system/primitives
// ---------------------------------------------------------------------------

jest.mock("@acme/design-system/primitives", () => ({
  StepFlowShell: ({
    title,
    children,
    onBack,
  }: {
    title: string;
    children: React.ReactNode;
    onBack?: () => void;
  }) => (
    <div>
      <h1>{title}</h1>
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Go back">
          Back
        </button>
      )}
      {children}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

const FUTURE_DATE = "2099-01-10";

/**
 * Builds a minimal preorders record where:
 *  - night1's serviceDate (or night, as fallback) matches FUTURE_DATE
 *  - drink1 controls tier detection
 */
function makePreorders(drink1: string) {
  return {
    night1: {
      night: FUTURE_DATE,
      breakfast: "NA",
      drink1,
      drink2: "NA",
      serviceDate: FUTURE_DATE,
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("EvDrinkOrderWizard", () => {
  it("TC-01: type-1 plan shows only type-1 drinks; Aperol Spritz (type 2) not visible", () => {
    // drink1 'PREPAID MP A' → tier 'type1'
    render(
      <EvDrinkOrderWizard
        serviceDate={FUTURE_DATE}
        preorders={makePreorders("PREPAID MP A")}
        onSubmit={jest.fn()}
        isSubmitting={false}
      />,
    );

    expect(screen.getByText("Coke")).toBeInTheDocument();
    expect(screen.getByText("Green Tea")).toBeInTheDocument();
    expect(screen.queryByText("Aperol Spritz")).not.toBeInTheDocument();
    expect(screen.queryByText("Glass of Prosecco")).not.toBeInTheDocument();
    expect(screen.queryByText("Large Peroni")).not.toBeInTheDocument();
  });

  it("TC-02: full-access plan (PREPAID MP B) shows all drinks including Aperol Spritz", () => {
    // drink1 'PREPAID MP B' → tier 'all'
    render(
      <EvDrinkOrderWizard
        serviceDate={FUTURE_DATE}
        preorders={makePreorders("PREPAID MP B")}
        onSubmit={jest.fn()}
        isSubmitting={false}
      />,
    );

    expect(screen.getByText("Coke")).toBeInTheDocument();
    expect(screen.getByText("Aperol Spritz")).toBeInTheDocument();
    expect(screen.getByText("Glass of Prosecco")).toBeInTheDocument();
    expect(screen.getByText("Large Peroni")).toBeInTheDocument();
  });

  it("TC-03: selecting Americano (has modifiers) then Next shows modifier step", () => {
    render(
      <EvDrinkOrderWizard
        serviceDate={FUTURE_DATE}
        preorders={makePreorders("PREPAID MP A")}
        onSubmit={jest.fn()}
        isSubmitting={false}
      />,
    );

    // Drink step
    expect(
      screen.getByRole("heading", { name: "Choose your drink" }),
    ).toBeInTheDocument();

    // Americano has modifiers: sugar, milk
    // The label wraps the radio input, so getByLabelText matches by label text
    fireEvent.click(screen.getByLabelText("Americano"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Modifier step should appear
    expect(
      screen.getByRole("heading", { name: "Customise your drink" }),
    ).toBeInTheDocument();
  });

  it("TC-04: selecting Coke (no modifiers) then Next goes straight to time step", () => {
    render(
      <EvDrinkOrderWizard
        serviceDate={FUTURE_DATE}
        preorders={makePreorders("PREPAID MP A")}
        onSubmit={jest.fn()}
        isSubmitting={false}
      />,
    );

    // Select Coke — no modifiers defined
    fireEvent.click(screen.getByLabelText("Coke"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Should jump directly to time step (no modifier step)
    expect(
      screen.getByRole("heading", { name: "Choose a delivery time" }),
    ).toBeInTheDocument();
  });

  it("TC-05: full path — Americano + With Milk + With Sugar + 19:30 → onSubmit correct value", () => {
    const onSubmit = jest.fn();
    render(
      <EvDrinkOrderWizard
        serviceDate={FUTURE_DATE}
        preorders={makePreorders("PREPAID MP A")}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );

    // Step 1: drink
    fireEvent.click(screen.getByLabelText("Americano"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Step 2: modifier
    expect(
      screen.getByRole("heading", { name: "Customise your drink" }),
    ).toBeInTheDocument();
    // Tick "With Milk" and "With Sugar" checkboxes
    fireEvent.click(screen.getByLabelText("With Milk"));
    fireEvent.click(screen.getByLabelText("With Sugar"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Step 3: time
    expect(
      screen.getByRole("heading", { name: "Choose a delivery time" }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "19:30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Step 4: confirmation
    expect(
      screen.getByRole("heading", { name: "Confirm your order" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Confirm order" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    // Americano's modifiers are defined as { sugar: false, milk: false } in menuData,
    // so iteration order is sugar → milk, matching the buildEvDrinkOrderValue segment order.
    expect(onSubmit).toHaveBeenCalledWith(
      "Americano, With Sugar, With Milk | 19:30",
    );
  });
});

// ---------------------------------------------------------------------------
// detectDrinkTier (unit tests — imported directly from the hook module)
// ---------------------------------------------------------------------------

describe("detectDrinkTier", () => {
  const futureDate = "2099-01-10";

  it("returns 'type1' when drink1 is PREPAID MP A (space-separated)", () => {
    const preorders = {
      night1: {
        night: futureDate,
        breakfast: "NA",
        drink1: "PREPAID MP A",
        drink2: "NA",
        serviceDate: futureDate,
      },
    };
    expect(detectDrinkTier(preorders, futureDate)).toBe("type1");
  });

  it("returns 'all' when drink1 is PREPAID MP B (space-separated)", () => {
    const preorders = {
      night1: {
        night: futureDate,
        breakfast: "NA",
        drink1: "PREPAID MP B",
        drink2: "NA",
        serviceDate: futureDate,
      },
    };
    expect(detectDrinkTier(preorders, futureDate)).toBe("all");
  });

  it("TC-05 (spec): returns 'all' when drink1 uses underscore form PREPAID_MP_B", () => {
    // detectDrinkTier normalises underscores to spaces before comparison
    const preorders = {
      night1: {
        night: futureDate,
        breakfast: "NA",
        drink1: "PREPAID_MP_B",
        drink2: "NA",
        serviceDate: futureDate,
      },
    };
    expect(detectDrinkTier(preorders, futureDate)).toBe("all");
  });

  it("returns 'all' when drink1 uses underscore form PREPAID_MP_C", () => {
    const preorders = {
      night1: {
        night: futureDate,
        breakfast: "NA",
        drink1: "PREPAID_MP_C",
        drink2: "NA",
        serviceDate: futureDate,
      },
    };
    expect(detectDrinkTier(preorders, futureDate)).toBe("all");
  });

  it("returns 'type1' fallback when no entry matches serviceDate", () => {
    const preorders = {
      night1: {
        night: "2099-01-11",
        breakfast: "NA",
        drink1: "PREPAID MP B",
        drink2: "NA",
        serviceDate: "2099-01-11",
      },
    };
    // serviceDate is 2099-01-10 but only night for 2099-01-11 exists
    expect(detectDrinkTier(preorders, futureDate)).toBe("type1");
  });

  it("returns 'type1' fallback when preorders is empty", () => {
    expect(detectDrinkTier({}, futureDate)).toBe("type1");
  });

  it("matches via night field when serviceDate is absent", () => {
    const preorders = {
      night1: {
        night: futureDate,
        breakfast: "NA",
        drink1: "PREPAID MP B",
        drink2: "NA",
        // no serviceDate — should fall back to night
      },
    };
    expect(detectDrinkTier(preorders, futureDate)).toBe("all");
  });
});
