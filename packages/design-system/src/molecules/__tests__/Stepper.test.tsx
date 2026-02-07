/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";

import { Stepper, StepperStep } from "../Stepper";

describe("Stepper", () => {
  it("TC-01: renders step labels with correct ARIA attributes", () => {
    render(
      <Stepper currentStep={1}>
        <StepperStep step={0} label="Cart" />
        <StepperStep step={1} label="Shipping" />
        <StepperStep step={2} label="Payment" />
      </Stepper>
    );

    expect(screen.getByText("Cart")).toBeInTheDocument();
    expect(screen.getByText("Shipping")).toBeInTheDocument();
    expect(screen.getByText("Payment")).toBeInTheDocument();

    // Current step should have aria-current="step"
    const currentStepElement = screen.getByText("Shipping").closest("li");
    expect(currentStepElement).toHaveAttribute("aria-current", "step");

    // Other steps should not have aria-current
    const cartElement = screen.getByText("Cart").closest("li");
    expect(cartElement).not.toHaveAttribute("aria-current");

    const paymentElement = screen.getByText("Payment").closest("li");
    expect(paymentElement).not.toHaveAttribute("aria-current");
  });

  it("TC-02: completed steps show completed styling with checkmark", () => {
    render(
      <Stepper currentStep={2}>
        <StepperStep step={0} label="Cart" />
        <StepperStep step={1} label="Shipping" />
        <StepperStep step={2} label="Payment" />
      </Stepper>
    );

    // Completed steps (0, 1) should have checkmark icons
    const stepElements = screen.getAllByRole("listitem");

    // First two steps should be completed (have checkmarks)
    const cartStep = stepElements[0];
    const shippingStep = stepElements[1];

    // Check for the CheckIcon SVG element in completed steps
    expect(cartStep.querySelector("svg")).toBeInTheDocument();
    expect(shippingStep.querySelector("svg")).toBeInTheDocument();

    // Current step (2) should show the step number, not a checkmark
    const paymentStep = stepElements[2];
    expect(paymentStep.textContent).toContain("3");
  });

  it("TC-03: disabled steps are not interactive", () => {
    render(
      <Stepper currentStep={0}>
        <StepperStep step={0} label="Cart" status="current" />
        <StepperStep step={1} label="Shipping" status="disabled" />
        <StepperStep step={2} label="Payment" status="disabled" />
      </Stepper>
    );

    const stepElements = screen.getAllByRole("listitem");

    // Disabled steps should have reduced opacity
    const shippingStep = stepElements[1];
    const paymentStep = stepElements[2];

    expect(shippingStep.querySelector('[class*="opacity-50"]')).toBeInTheDocument();
    expect(paymentStep.querySelector('[class*="opacity-50"]')).toBeInTheDocument();
  });

  it("TC-04: vertical orientation renders correctly", () => {
    render(
      <Stepper currentStep={1} orientation="vertical">
        <StepperStep step={0} label="Cart" />
        <StepperStep step={1} label="Shipping" />
        <StepperStep step={2} label="Payment" />
      </Stepper>
    );

    const list = screen.getByRole("list");
    expect(list).toHaveClass("flex-col");

    // Steps should render
    expect(screen.getByText("Cart")).toBeInTheDocument();
    expect(screen.getByText("Shipping")).toBeInTheDocument();
    expect(screen.getByText("Payment")).toBeInTheDocument();
  });

  it("TC-05: custom className merges on root", () => {
    render(
      <Stepper currentStep={0} className="custom-stepper-class">
        <StepperStep step={0} label="Step 1" />
        <StepperStep step={1} label="Step 2" />
      </Stepper>
    );

    const list = screen.getByRole("list");
    expect(list).toHaveClass("custom-stepper-class");
    expect(list).toHaveClass("flex"); // Should also have default classes
  });

  it("renders step descriptions when provided", () => {
    render(
      <Stepper currentStep={0}>
        <StepperStep step={0} label="Cart" description="Review your items" />
        <StepperStep step={1} label="Shipping" description="Enter address" />
      </Stepper>
    );

    expect(screen.getByText("Review your items")).toBeInTheDocument();
    expect(screen.getByText("Enter address")).toBeInTheDocument();
  });

  it("renders custom icons when provided", () => {
    const customIcon = <span data-cy="custom-icon">🎨</span>;

    render(
      <Stepper currentStep={0}>
        <StepperStep step={0} label="Design" icon={customIcon} />
        <StepperStep step={1} label="Review" />
      </Stepper>
    );

    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("handles explicit status prop override", () => {
    render(
      <Stepper currentStep={0}>
        <StepperStep step={0} label="Step 1" status="completed" />
        <StepperStep step={1} label="Step 2" status="current" />
        <StepperStep step={2} label="Step 3" status="upcoming" />
      </Stepper>
    );

    const stepElements = screen.getAllByRole("listitem");

    // Step 1 should have aria-current even though currentStep is 0
    const step2Element = stepElements[1];
    expect(step2Element).toHaveAttribute("aria-current", "step");
  });

  it("includes data-cy attributes for testing", () => {
    render(
      <Stepper currentStep={0}>
        <StepperStep step={0} label="Step 1" />
        <StepperStep step={1} label="Step 2" />
      </Stepper>
    );

    expect(screen.getByTestId("stepper-step-0")).toBeInTheDocument();
    expect(screen.getByTestId("stepper-step-1")).toBeInTheDocument();

    const stepper = screen.getByRole("list");
    expect(stepper).toHaveAttribute("data-cy", "stepper");
  });
});
