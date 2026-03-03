"use client";

import React, {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

// ============================================================================
// Types
// ============================================================================

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  optional?: boolean;
  validate?: () => boolean | Promise<boolean>;
}

export interface StepWizardProps {
  steps: WizardStep[];
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number, direction: "next" | "prev") => void;
  onComplete?: () => void;
  allowSkipOptional?: boolean;
  showStepNumbers?: boolean;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export interface StepContentProps {
  stepId: string;
  children: ReactNode;
}

export interface StepActionsProps {
  children?: ReactNode;
  nextLabel?: string;
  prevLabel?: string;
  completeLabel?: string;
  showPrev?: boolean;
  showNext?: boolean;
  className?: string;
}

interface WizardContextValue {
  currentStep: number;
  steps: WizardStep[];
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;
  canGoPrev: boolean;
  goToStep: (step: number) => Promise<boolean>;
  nextStep: () => Promise<boolean>;
  prevStep: () => void;
  completeWizard: () => Promise<boolean>;
  isValidating: boolean;
  visitedSteps: Set<number>;
  completedSteps: Set<number>;
}

// ============================================================================
// Context
// ============================================================================

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within a StepWizard");
  }
  return context;
}

// ============================================================================
// Step Indicator
// ============================================================================

interface StepIndicatorProps {
  steps: WizardStep[];
  currentStep: number;
  visitedSteps: Set<number>;
  completedSteps: Set<number>;
  orientation: "horizontal" | "vertical";
  showStepNumbers: boolean;
  onStepClick?: (step: number) => void;
}

function StepIndicator({
  steps,
  currentStep,
  visitedSteps,
  completedSteps,
  orientation,
  showStepNumbers,
  onStepClick,
}: StepIndicatorProps) {
  const isHorizontal = orientation === "horizontal";

  return (
    <nav
      aria-label="Progress"
      className={
        isHorizontal
          ? "mb-8"
          : "mr-8 min-w-48"
      }
    >
      <ol
        className={
          isHorizontal
            ? "flex items-center justify-between"
            : "flex flex-col space-y-4"
        }
      >
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps.has(index);
          const isVisited = visitedSteps.has(index);
          const Icon = step.icon;

          return (
            <li
              key={step.id}
              className={
                isHorizontal
                  ? "flex items-center" + (index < steps.length - 1 ? " flex-1" : "")
                  : "relative"
              }
            >
              <button
                type="button"
                onClick={() => onStepClick?.(index)}
                disabled={!isVisited && !isCompleted}
                className={
                  "group flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg " +
                  (isVisited || isCompleted ? "cursor-pointer" : "cursor-not-allowed")
                }
                aria-current={isActive ? "step" : undefined}
              >
                {/* Step circle */}
                <span
                  className={
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors " +
                    (isActive
                      ? "border-primary bg-primary text-primary-fg"
                      : isCompleted
                      ? "border-success bg-success text-success-fg"
                      : isVisited
                      ? "border-border bg-bg text-fg-muted group-hover:border-border-strong"
                      : "border-border-muted bg-bg text-fg-muted")
                  }
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : Icon ? (
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  ) : showStepNumbers ? (
                    <span className="text-sm font-medium">{index + 1}</span>
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-current" />
                  )}
                </span>

                {/* Step text */}
                <span className="ms-3 text-start">
                  <span
                    className={
                      "block text-sm font-medium " +
                      (isActive
                        ? "text-primary"
                        : isCompleted
                        ? "text-success-fg"
                        : "text-fg-muted")
                    }
                  >
                    {step.title}
                    {step.optional && (
                      <span className="ms-1 text-xs text-fg-muted">
                        (optional)
                      </span>
                    )}
                  </span>
                  {step.description && (
                    <span className="block text-xs text-fg-muted">
                      {step.description}
                    </span>
                  )}
                </span>
              </button>

              {/* Connector line (horizontal) */}
              {isHorizontal && index < steps.length - 1 && (
                <div
                  className={
                    "ml-4 h-0.5 flex-1 " +
                    (completedSteps.has(index)
                      ? "bg-success"
                      : "bg-border")
                  }
                  aria-hidden="true"
                />
              )}

              {/* Connector line (vertical) */}
              {!isHorizontal && index < steps.length - 1 && (
                <div
                  className={
                    "absolute left-5 top-10 h-full w-0.5 -translate-x-1/2 " +
                    (completedSteps.has(index)
                      ? "bg-success"
                      : "bg-border")
                  }
                  aria-hidden="true"
                  style={{ height: "calc(100% + 1rem)" }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ============================================================================
// StepWizard Component
// ============================================================================

export function StepWizard({
  steps,
  children,
  initialStep = 0,
  onStepChange,
  onComplete,
  allowSkipOptional = true,
  showStepNumbers = true,
  orientation = "horizontal",
  className = "",
}: StepWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isValidating, setIsValidating] = useState(false);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(
    () => new Set([initialStep])
  );
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    () => new Set()
  );

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  const canGoNext = useMemo(() => {
    if (isLastStep) return false;
    return true;
  }, [isLastStep]);

  const canGoPrev = useMemo(() => {
    return !isFirstStep;
  }, [isFirstStep]);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    if (!currentStepData?.validate) return true;

    setIsValidating(true);
    try {
      const result = await currentStepData.validate();
      return result;
    } finally {
      setIsValidating(false);
    }
  }, [currentStepData]);

  const goToStep = useCallback(
    async (step: number): Promise<boolean> => {
      if (step < 0 || step >= steps.length) return false;
      if (step === currentStep) return true;

      // If going forward, validate current step
      if (step > currentStep) {
        const isValid = await validateCurrentStep();
        if (!isValid) return false;

        // Mark current step as completed
        setCompletedSteps((prev) => new Set([...prev, currentStep]));
      }

      setCurrentStep(step);
      setVisitedSteps((prev) => new Set([...prev, step]));
      onStepChange?.(step, step > currentStep ? "next" : "prev");
      return true;
    },
    [currentStep, steps.length, validateCurrentStep, onStepChange]
  );

  const nextStep = useCallback(async (): Promise<boolean> => {
    if (!canGoNext) return false;

    // Check if current step is optional and can be skipped
    if (currentStepData?.optional && allowSkipOptional) {
      setCurrentStep((prev) => prev + 1);
      setVisitedSteps((prev) => new Set([...prev, currentStep + 1]));
      onStepChange?.(currentStep + 1, "next");
      return true;
    }

    return goToStep(currentStep + 1);
  }, [
    canGoNext,
    currentStepData,
    allowSkipOptional,
    currentStep,
    goToStep,
    onStepChange,
  ]);

  const prevStep = useCallback(() => {
    if (!canGoPrev) return;
    setCurrentStep((prev) => prev - 1);
    onStepChange?.(currentStep - 1, "prev");
  }, [canGoPrev, currentStep, onStepChange]);

  const completeWizard = useCallback(async (): Promise<boolean> => {
    const isValid = await validateCurrentStep();
    if (!isValid) return false;

    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    onComplete?.();
    return true;
  }, [validateCurrentStep, currentStep, onComplete]);

  const handleStepClick = useCallback(
    (step: number) => {
      if (visitedSteps.has(step) || completedSteps.has(step)) {
        goToStep(step);
      }
    },
    [visitedSteps, completedSteps, goToStep]
  );

  const contextValue = useMemo<WizardContextValue>(
    () => ({
      currentStep,
      steps,
      isFirstStep,
      isLastStep,
      canGoNext,
      canGoPrev,
      goToStep,
      nextStep,
      prevStep,
      completeWizard,
      isValidating,
      visitedSteps,
      completedSteps,
    }),
    [
      currentStep,
      steps,
      isFirstStep,
      isLastStep,
      canGoNext,
      canGoPrev,
      goToStep,
      nextStep,
      prevStep,
      completeWizard,
      isValidating,
      visitedSteps,
      completedSteps,
    ]
  );

  return (
    <WizardContext.Provider value={contextValue}>
      <div
        className={
          "w-full " +
          (orientation === "vertical" ? "flex" : "") +
          (className ? " " + className : "")
        }
      >
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          visitedSteps={visitedSteps}
          completedSteps={completedSteps}
          orientation={orientation}
          showStepNumbers={showStepNumbers}
          onStepClick={handleStepClick}
        />

        <div className="flex-1">{children}</div>
      </div>
    </WizardContext.Provider>
  );
}

// ============================================================================
// StepContent Component
// ============================================================================

export function StepContent({ stepId, children }: StepContentProps) {
  const { currentStep, steps } = useWizard();
  const stepIndex = steps.findIndex((s) => s.id === stepId);

  if (stepIndex !== currentStep) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      aria-labelledby={`step-${stepId}`}
      className="animate-in fade-in slide-in-from-right-4 duration-300"
    >
      {children}
    </div>
  );
}

// ============================================================================
// StepActions Component
// ============================================================================

export function StepActions({
  children,
  nextLabel = "Next",
  prevLabel = "Back",
  completeLabel = "Complete",
  showPrev = true,
  showNext = true,
  className = "",
}: StepActionsProps) {
  const {
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrev,
    nextStep,
    prevStep,
    completeWizard,
    isValidating,
  } = useWizard();

  return (
    <div
      className={
        "mt-8 flex items-center justify-between " + className
      }
    >
      <div>
        {showPrev && !isFirstStep && (
          <button
            type="button"
            onClick={prevStep}
            disabled={!canGoPrev || isValidating}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium text-fg shadow-sm hover:bg-bg-2 focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary focus-visible:focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-11 min-w-11"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            {prevLabel}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {children}

        {showNext && (
          <button
            type="button"
            onClick={isLastStep ? completeWizard : nextStep}
            disabled={(!canGoNext && !isLastStep) || isValidating}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-fg shadow-sm hover:bg-primary-hover focus:outline-none focus-visible:focus:ring-2 focus-visible:focus:ring-primary focus-visible:focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-11 min-w-11"
          >
            {isValidating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-fg border-t-transparent" />
                Validating...
              </>
            ) : isLastStep ? (
              <>
                {completeLabel}
                <Check className="h-4 w-4" aria-hidden="true" />
              </>
            ) : (
              <>
                {nextLabel}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default StepWizard;
