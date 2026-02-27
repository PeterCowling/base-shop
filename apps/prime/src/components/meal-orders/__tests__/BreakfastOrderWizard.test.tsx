 
import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { BreakfastOrderWizard } from "../BreakfastOrderWizard";

// ---------------------------------------------------------------------------
// Mock @acme/design-system/primitives
// Avoids lucide-react / CSS complications while preserving shell semantics.
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
// Helper: a far-future service date that will never hit the same-day policy
// ---------------------------------------------------------------------------

const FUTURE_DATE = "2099-06-15";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("BreakfastOrderWizard", () => {
  it("TC-01: renders food step on mount with all 6 food options", () => {
    render(
      <BreakfastOrderWizard
        serviceDate={FUTURE_DATE}
        onSubmit={jest.fn()}
        isSubmitting={false}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Choose your breakfast" }),
    ).toBeInTheDocument();

    // All 6 food options from breakfastOptions in menuData.
    // The inputs use name="breakfast-food"; query via DOM to get exact count.
    const allFoodRadios = document.querySelectorAll(
      'input[name="breakfast-food"]',
    );
    expect(allFoodRadios).toHaveLength(6);

    // Spot-check visible labels
    expect(screen.getByText("Eggs with three sides")).toBeInTheDocument();
    expect(screen.getByText("Pancakes")).toBeInTheDocument();
    expect(
      screen.getByText("Veggie Toast (with seasonal vegetables)"),
    ).toBeInTheDocument();
    expect(screen.getByText("French Toast with Golden Syrup")).toBeInTheDocument();
    expect(screen.getByText("French Toast stuffed with Nutella")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Healthy Delight (parfait of yoghurt, granola & homemade fruit compote)",
      ),
    ).toBeInTheDocument();
  });

  it("TC-02: selecting Eggs and clicking Next advances to egg style & sides step", () => {
    render(
      <BreakfastOrderWizard
        serviceDate={FUTURE_DATE}
        onSubmit={jest.fn()}
        isSubmitting={false}
      />,
    );

    // Select "Eggs"
    fireEvent.click(screen.getByLabelText("Eggs with three sides"));

    // Advance
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByRole("heading", { name: "Egg style & sides" }),
    ).toBeInTheDocument();
  });

  it("TC-03: on egg step, Next is disabled until egg style AND 3 sides are selected", () => {
    render(
      <BreakfastOrderWizard
        serviceDate={FUTURE_DATE}
        onSubmit={jest.fn()}
        isSubmitting={false}
      />,
    );

    // Move to egg step
    fireEvent.click(screen.getByLabelText("Eggs with three sides"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    const nextBtn = screen.getByRole("button", { name: "Next" });

    // Nothing selected — disabled
    expect(nextBtn).toBeDisabled();

    // Select egg style only — still disabled
    fireEvent.click(screen.getByLabelText("Scrambled"));
    expect(nextBtn).toBeDisabled();

    // Select 2 sides — still disabled
    fireEvent.click(screen.getByLabelText("Bacon"));
    fireEvent.click(screen.getByLabelText("Ham"));
    expect(nextBtn).toBeDisabled();

    // Select 3rd side — now enabled
    fireEvent.click(screen.getByLabelText("Toast"));
    expect(nextBtn).toBeEnabled();
  });

  it("TC-04: egg style + 3 sides → Next advances to drinks step", () => {
    render(
      <BreakfastOrderWizard
        serviceDate={FUTURE_DATE}
        onSubmit={jest.fn()}
        isSubmitting={false}
      />,
    );

    // Food step
    fireEvent.click(screen.getByLabelText("Eggs with three sides"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Egg style & sides step
    fireEvent.click(screen.getByLabelText("Scrambled"));
    fireEvent.click(screen.getByLabelText("Bacon"));
    fireEvent.click(screen.getByLabelText("Ham"));
    fireEvent.click(screen.getByLabelText("Toast"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByRole("heading", { name: "Choose your drink" }),
    ).toBeInTheDocument();
  });

  it("TC-05: full happy path — Eggs + Scrambled + [Bacon, Ham, Toast] + Americano + Oat Milk + No Sugar + 09:00 → onSubmit called with correct value", () => {
    const onSubmit = jest.fn();
    render(
      <BreakfastOrderWizard
        serviceDate={FUTURE_DATE}
        onSubmit={onSubmit}
        isSubmitting={false}
      />,
    );

    // Step 1: food
    fireEvent.click(screen.getByLabelText("Eggs with three sides"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Step 2: egg style & sides
    fireEvent.click(screen.getByLabelText("Scrambled"));
    fireEvent.click(screen.getByLabelText("Bacon"));
    fireEvent.click(screen.getByLabelText("Ham"));
    fireEvent.click(screen.getByLabelText("Toast"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Step 3: drinks — Americano triggers the milksugar sub-step
    fireEvent.click(screen.getByLabelText("Americano"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Step 4: milk & sugar
    expect(
      screen.getByRole("heading", { name: "Milk & Sugar" }),
    ).toBeInTheDocument();

    // Select Oat Milk and No Sugar — both inside the implicit-label wrappers
    fireEvent.click(screen.getByLabelText("Oat Milk"));
    fireEvent.click(screen.getByLabelText("No Sugar"));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Step 5: delivery time
    expect(
      screen.getByRole("heading", { name: "Delivery time" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "09:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    // Step 6: confirmation
    expect(
      screen.getByRole("heading", { name: "Confirm your order" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Confirm order" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      // sides are sorted alphabetically: Bacon, Ham, Toast
      "Eggs (Scrambled) | Bacon, Ham, Toast | Americano, Oat Milk, No Sugar | 09:00",
    );
  });
});
