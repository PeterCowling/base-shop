import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import {
  StepActions,
  StepContent,
  StepWizard,
  useWizard,
  type WizardStep,
} from "./StepWizard";

const mockSteps: WizardStep[] = [
  { id: "step1", title: "Step 1", description: "First step" },
  { id: "step2", title: "Step 2", description: "Second step" },
  { id: "step3", title: "Step 3", description: "Third step" },
];

function TestWizard({
  steps = mockSteps,
  onComplete,
  onStepChange,
}: {
  steps?: WizardStep[];
  onComplete?: () => void;
  onStepChange?: (step: number, direction: "next" | "prev") => void;
}) {
  return (
    <StepWizard steps={steps} onComplete={onComplete} onStepChange={onStepChange}>
      <StepContent stepId="step1">
        <div>Step 1 Content</div>
      </StepContent>
      <StepContent stepId="step2">
        <div>Step 2 Content</div>
      </StepContent>
      <StepContent stepId="step3">
        <div>Step 3 Content</div>
      </StepContent>
      <StepActions />
    </StepWizard>
  );
}

describe("StepWizard", () => {
  describe("rendering", () => {
    it("renders step indicators", () => {
      render(<TestWizard />);

      expect(screen.getByText("Step 1")).toBeInTheDocument();
      expect(screen.getByText("Step 2")).toBeInTheDocument();
      expect(screen.getByText("Step 3")).toBeInTheDocument();
    });

    it("renders first step content by default", () => {
      render(<TestWizard />);

      expect(screen.getByText("Step 1 Content")).toBeInTheDocument();
      expect(screen.queryByText("Step 2 Content")).not.toBeInTheDocument();
    });

    it("renders step descriptions", () => {
      render(<TestWizard />);

      expect(screen.getByText("First step")).toBeInTheDocument();
      expect(screen.getByText("Second step")).toBeInTheDocument();
    });

    it("shows optional label for optional steps", () => {
      const stepsWithOptional: WizardStep[] = [
        { id: "step1", title: "Step 1" },
        { id: "step2", title: "Step 2", optional: true },
      ];

      render(
        <StepWizard steps={stepsWithOptional}>
          <StepContent stepId="step1">Content 1</StepContent>
          <StepContent stepId="step2">Content 2</StepContent>
          <StepActions />
        </StepWizard>
      );

      expect(screen.getByText("(optional)")).toBeInTheDocument();
    });
  });

  describe("navigation", () => {
    it("navigates to next step when clicking Next", async () => {
      render(<TestWizard />);

      fireEvent.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText("Step 2 Content")).toBeInTheDocument();
      });
    });

    it("navigates to previous step when clicking Back", async () => {
      render(<TestWizard />);

      // Go to step 2
      fireEvent.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText("Step 2 Content")).toBeInTheDocument();
      });

      // Go back to step 1
      fireEvent.click(screen.getByRole("button", { name: /back/i }));

      expect(screen.getByText("Step 1 Content")).toBeInTheDocument();
    });

    it("hides Back button on first step", () => {
      render(<TestWizard />);

      expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();
    });

    it("shows Complete button on last step", async () => {
      render(<TestWizard />);

      // Navigate to last step
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText("Step 2 Content")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText("Step 3 Content")).toBeInTheDocument();
      });

      expect(screen.getByRole("button", { name: /complete/i })).toBeInTheDocument();
    });

    it("calls onStepChange when navigating", async () => {
      const onStepChange = jest.fn();
      render(<TestWizard onStepChange={onStepChange} />);

      fireEvent.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(onStepChange).toHaveBeenCalledWith(1, "next");
      });
    });

    it("calls onComplete when completing wizard", async () => {
      const onComplete = jest.fn();
      render(<TestWizard onComplete={onComplete} />);

      // Navigate to last step
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText("Step 2 Content")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText("Step 3 Content")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: /complete/i }));

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe("validation", () => {
    it("prevents navigation when validation fails", async () => {
      const stepsWithValidation: WizardStep[] = [
        { id: "step1", title: "Step 1", validate: () => false },
        { id: "step2", title: "Step 2" },
      ];

      render(
        <StepWizard steps={stepsWithValidation}>
          <StepContent stepId="step1">Content 1</StepContent>
          <StepContent stepId="step2">Content 2</StepContent>
          <StepActions />
        </StepWizard>
      );

      fireEvent.click(screen.getByRole("button", { name: /next/i }));

      // Should still be on step 1
      await waitFor(() => {
        expect(screen.getByText("Content 1")).toBeInTheDocument();
      });
      expect(screen.queryByText("Content 2")).not.toBeInTheDocument();
    });

    it("allows navigation when validation passes", async () => {
      const stepsWithValidation: WizardStep[] = [
        { id: "step1", title: "Step 1", validate: () => true },
        { id: "step2", title: "Step 2" },
      ];

      render(
        <StepWizard steps={stepsWithValidation}>
          <StepContent stepId="step1">Content 1</StepContent>
          <StepContent stepId="step2">Content 2</StepContent>
          <StepActions />
        </StepWizard>
      );

      fireEvent.click(screen.getByRole("button", { name: /next/i }));

      await waitFor(() => {
        expect(screen.getByText("Content 2")).toBeInTheDocument();
      });
    });

    it("supports async validation", async () => {
      const stepsWithAsyncValidation: WizardStep[] = [
        {
          id: "step1",
          title: "Step 1",
          validate: () => new Promise((resolve) => setTimeout(() => resolve(true), 50)),
        },
        { id: "step2", title: "Step 2" },
      ];

      render(
        <StepWizard steps={stepsWithAsyncValidation}>
          <StepContent stepId="step1">Content 1</StepContent>
          <StepContent stepId="step2">Content 2</StepContent>
          <StepActions />
        </StepWizard>
      );

      fireEvent.click(screen.getByRole("button", { name: /next/i }));

      // Should show validating state
      await waitFor(() => {
        expect(screen.getByText(/validating/i)).toBeInTheDocument();
      });

      // Then navigate
      await waitFor(() => {
        expect(screen.getByText("Content 2")).toBeInTheDocument();
      });
    });
  });

  describe("step clicking", () => {
    it("allows clicking on visited steps", async () => {
      render(<TestWizard />);

      // Go to step 2
      fireEvent.click(screen.getByRole("button", { name: /next/i }));
      await waitFor(() => {
        expect(screen.getByText("Step 2 Content")).toBeInTheDocument();
      });

      // Click on step 1 indicator
      fireEvent.click(screen.getByText("Step 1").closest("button")!);

      await waitFor(() => {
        expect(screen.getByText("Step 1 Content")).toBeInTheDocument();
      });
    });

    it("disables clicking on unvisited steps", () => {
      render(<TestWizard />);

      const step3Button = screen.getByText("Step 3").closest("button")!;
      expect(step3Button).toBeDisabled();
    });
  });

  describe("useWizard hook", () => {
    it("provides wizard context values", () => {
      function TestComponent() {
        const wizard = useWizard();
        return (
          <div>
            <span data-testid="current-step">{wizard.currentStep}</span>
            <span data-testid="is-first">{wizard.isFirstStep.toString()}</span>
            <span data-testid="is-last">{wizard.isLastStep.toString()}</span>
          </div>
        );
      }

      render(
        <StepWizard steps={mockSteps}>
          <TestComponent />
        </StepWizard>
      );

      expect(screen.getByTestId("current-step")).toHaveTextContent("0");
      expect(screen.getByTestId("is-first")).toHaveTextContent("true");
      expect(screen.getByTestId("is-last")).toHaveTextContent("false");
    });

    it("throws error when used outside StepWizard", () => {
      function TestComponent() {
        useWizard();
        return null;
      }

      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        "useWizard must be used within a StepWizard"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("orientation", () => {
    it("renders horizontally by default", () => {
      const { container } = render(<TestWizard />);

      const nav = container.querySelector("nav ol");
      expect(nav).toHaveClass("flex", "items-center");
    });

    it("renders vertically when specified", () => {
      const { container } = render(
        <StepWizard steps={mockSteps} orientation="vertical">
          <StepContent stepId="step1">Content</StepContent>
          <StepActions />
        </StepWizard>
      );

      const nav = container.querySelector("nav ol");
      expect(nav).toHaveClass("flex-col");
    });
  });

  describe("custom labels", () => {
    it("uses custom button labels", () => {
      render(
        <StepWizard steps={mockSteps}>
          <StepContent stepId="step1">Content</StepContent>
          <StepActions
            nextLabel="Continue"
            prevLabel="Go Back"
            completeLabel="Finish"
          />
        </StepWizard>
      );

      expect(screen.getByRole("button", { name: /continue/i })).toBeInTheDocument();
    });
  });
});
