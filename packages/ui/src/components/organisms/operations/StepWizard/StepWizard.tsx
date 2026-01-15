"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
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
                  "group flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg " +
                  (isVisited || isCompleted ? "cursor-pointer" : "cursor-not-allowed")
                }
                aria-current={isActive ? "step" : undefined}
              >
                {/* Step circle */}
                <span
                  className={
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors " +
                    (isActive
                      ? "border-blue-600 bg-blue-600 text-white"
                      : isCompleted
                      ? "border-green-600 bg-green-600 text-white"
                      : isVisited
                      ? "border-gray-300 bg-white text-gray-500 group-hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      : "border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-600")
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
                <span className="ml-3 text-left">
                  <span
                    className={
                      "block text-sm font-medium " +
                      (isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : isCompleted
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-500 dark:text-gray-400")
                    }
                  >
                    {step.title}
                    {step.optional && (
                      <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                        (optional)
                      </span>
                    )}
                  </span>
                  {step.description && (
                    <span className="block text-xs text-gray-400 dark:text-gray-500">
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
                      ? "bg-green-600"
                      : "bg-gray-200 dark:bg-gray-700")
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
                      ? "bg-green-600"
                      : "bg-gray-200 dark:bg-gray-700")
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
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
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
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isValidating ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
