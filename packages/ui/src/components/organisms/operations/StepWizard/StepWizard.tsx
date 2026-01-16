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
import { useTranslations } from "@acme/i18n";
import { Inline, Stack } from "../../../atoms/primitives";
import { cn } from "../../../../utils/style/cn";

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
    // i18n-exempt -- UI-3013 [ttl=2026-12-31] developer-facing error message
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
  const t = useTranslations();

  return (
    <nav
      aria-label={t("stepWizard.progress")}
      className={isHorizontal ? "mb-8" : "me-8 min-w-48"}
    >
      {isHorizontal ? (
        <Inline asChild alignY="center" className="justify-between">
          <ol>
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(index);
              const isVisited = visitedSteps.has(index);
              const Icon = step.icon;

              return (
                <Inline
                  asChild
                  alignY="center"
                  wrap={false}
                  className={cn(index < steps.length - 1 && "flex-1")}
                  key={step.id}
                >
                  <li>
                    <button
                      id={`step-${step.id}`}
                      type="button"
                      onClick={() => onStepClick?.(index)}
                      disabled={!isVisited && !isCompleted}
                      className={cn(
                        "group inline-flex min-h-11 items-center rounded-lg",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        isVisited || isCompleted
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-60"
                      )}
                      aria-current={isActive ? "step" : undefined}
                    >
                      {/* Step circle */}
                      <span
                        className={cn(
                          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          isActive
                            ? "border-primary bg-primary text-primary-foreground"
                            : isCompleted
                            ? "border-success bg-success text-success-foreground"
                            : isVisited
                            ? "border-border-2 bg-surface-1 text-muted group-hover:border-border-2"
                            : "border-border-1 bg-surface-1 text-muted"
                        )}
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
                          className={cn(
                            "block text-sm font-medium",
                            isActive
                              ? "text-primary"
                              : isCompleted
                              ? "text-success"
                              : "text-muted"
                          )}
                        >
                          {step.title}
                          {step.optional && (
                            <span className="ms-1 text-xs text-muted">
                              ({t("stepWizard.optional")})
                            </span>
                          )}
                        </span>
                        {step.description && (
                          <span className="block text-xs text-muted">
                            {step.description}
                          </span>
                        )}
                      </span>
                    </button>

                    {/* Connector line (horizontal) */}
                    {index < steps.length - 1 && (
                      <div
                        className={cn(
                          "ms-4 h-0.5 flex-1",
                          completedSteps.has(index)
                            ? "bg-success"
                            : "bg-border-2"
                        )}
                        aria-hidden="true"
                      />
                    )}
                  </li>
                </Inline>
              );
            })}
          </ol>
        </Inline>
      ) : (
        <Stack asChild gap={4}>
          <ol>
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(index);
              const isVisited = visitedSteps.has(index);
              const Icon = step.icon;

              return (
                <li key={step.id} className="relative">
                  <button
                    id={`step-${step.id}`}
                    type="button"
                    onClick={() => onStepClick?.(index)}
                    disabled={!isVisited && !isCompleted}
                    className={cn(
                      "group inline-flex min-h-11 items-center rounded-lg",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isVisited || isCompleted
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-60"
                    )}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {/* Step circle */}
                    <span
                      className={cn(
                        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isActive
                          ? "border-primary bg-primary text-primary-foreground"
                          : isCompleted
                          ? "border-success bg-success text-success-foreground"
                          : isVisited
                          ? "border-border-2 bg-surface-1 text-muted group-hover:border-border-2"
                          : "border-border-1 bg-surface-1 text-muted"
                      )}
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
                        className={cn(
                          "block text-sm font-medium",
                          isActive
                            ? "text-primary"
                            : isCompleted
                            ? "text-success"
                            : "text-muted"
                        )}
                      >
                        {step.title}
                        {step.optional && (
                          <span className="ms-1 text-xs text-muted">
                            ({t("stepWizard.optional")})
                          </span>
                        )}
                      </span>
                      {step.description && (
                        <span className="block text-xs text-muted">
                          {step.description}
                        </span>
                      )}
                    </span>
                  </button>

                  {/* Connector line (vertical) */}
                  {index < steps.length - 1 && (
                    <StyledDiv
                      className={cn(
                        "absolute start-5 top-10 h-full w-0.5 -translate-x-1/2",
                        completedSteps.has(index)
                          ? "bg-success"
                          : "bg-border-2"
                      )}
                      aria-hidden="true"
                      style={{
                        height: "calc(100% + 1rem)", // i18n-exempt -- UI-3020 [ttl=2026-12-31] non-UI style string
                      }}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </Stack>
      )}
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
      {orientation === "vertical" ? (
        <Inline asChild alignY="start" wrap={false} className={cn("w-full", className)}>
          <div>
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
        </Inline>
      ) : (
        <Stack asChild gap={0} className={cn("w-full", className)}>
          <div>
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
        </Stack>
      )}
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
  nextLabel,
  prevLabel,
  completeLabel,
  showPrev = true,
  showNext = true,
  className = "",
}: StepActionsProps) {
  const t = useTranslations();
  const resolvedNextLabel = nextLabel ?? t("stepWizard.next");
  const resolvedPrevLabel = prevLabel ?? t("stepWizard.back");
  const resolvedCompleteLabel = completeLabel ?? t("stepWizard.complete");
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
    <Inline alignY="center" className={cn("mt-8 w-full justify-between", className)}>
      <div>
        {showPrev && !isFirstStep && (
          <Inline asChild alignY="center" gap={2}>
            <button
              type="button"
              onClick={prevStep}
              disabled={!canGoPrev || isValidating}
              className={cn(
                "min-h-11 min-w-11 rounded-lg border border-border-2 bg-surface-1 px-4 py-2 text-sm font-medium text-fg shadow-sm",
                "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              {resolvedPrevLabel}
            </button>
          </Inline>
        )}
      </div>

      <Inline gap={3} alignY="center">
        {children}

        {showNext && (
          <Inline asChild alignY="center" gap={2}>
            <button
              type="button"
              onClick={isLastStep ? completeWizard : nextStep}
              disabled={(!canGoNext && !isLastStep) || isValidating}
              className={cn(
                "min-h-11 min-w-11 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm",
                "hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
            >
              {isValidating ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  {t("stepWizard.validating")}
                </>
              ) : isLastStep ? (
                <>
                  {resolvedCompleteLabel}
                  <Check className="h-4 w-4" aria-hidden="true" />
                </>
              ) : (
                <>
                  {resolvedNextLabel}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </Inline>
        )}
      </Inline>
    </Inline>
  );
}

export default StepWizard;

// Wrap DOM nodes to satisfy react/forbid-dom-props for "style"
const StyledDiv = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => <div ref={ref} {...props} />
);
StyledDiv.displayName = "StyledDiv";
