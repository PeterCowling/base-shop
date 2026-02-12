/* i18n-exempt file -- UI-000: Only non-user-facing literals (class names, HTML attributes). Labels are provided via props. */
"use client";

import * as React from "react";
import { CheckIcon } from "@radix-ui/react-icons";

import { cn } from "../utils/style";

export type StepStatus = "completed" | "current" | "upcoming" | "disabled";

export interface StepperProps extends React.HTMLAttributes<HTMLOListElement> {
  /**
   * Zero-based current step index.
   */
  currentStep: number;
  /**
   * Orientation of the stepper.
   */
  orientation?: "horizontal" | "vertical";
  /**
   * Child StepperStep components.
   */
  children: React.ReactNode;
}

export interface StepperStepProps extends React.HTMLAttributes<HTMLLIElement> {
  /**
   * Zero-based step index.
   */
  step: number;
  /**
   * Step label.
   */
  label: React.ReactNode;
  /**
   * Optional step description.
   */
  description?: React.ReactNode;
  /**
   * Step status (defaults to auto-calculation based on currentStep from parent).
   */
  status?: StepStatus;
  /**
   * Optional custom icon to display instead of step number.
   */
  icon?: React.ReactNode;
}

// Helper functions to reduce complexity
function getStepIndicatorClasses(status: StepStatus, isCompleted: boolean, isCurrent: boolean, isDisabled: boolean) {
  return cn(
    "grid size-8 shrink-0 place-content-center rounded-full border-2 font-medium text-sm transition-colors",
    isCompleted && "bg-primary border-primary text-primary-fg",
    isCurrent && "border-primary text-primary bg-background",
    (status === "upcoming" || isDisabled) && "border-muted text-muted-foreground bg-background",
    isDisabled && "opacity-50 cursor-not-allowed"
  );
}

function getStepLabelClasses(status: StepStatus, isCompleted: boolean, isCurrent: boolean, isDisabled: boolean) {
  return cn(
    "text-sm font-medium",
    isCurrent && "text-foreground",
    isCompleted && "text-foreground",
    (status === "upcoming" || isDisabled) && "text-muted-foreground",
    isDisabled && "opacity-50"
  );
}

function StepIndicator({ isCompleted, icon, step, status, isDisabled, isCurrent }: {
  isCompleted: boolean;
  icon?: React.ReactNode;
  step: number;
  status: StepStatus;
  isDisabled: boolean;
  isCurrent: boolean;
}) {
  return (
    <div className={getStepIndicatorClasses(status, isCompleted, isCurrent, isDisabled)}>
      {isCompleted ? <CheckIcon className="h-5 w-5" /> : icon ? icon : step + 1}
    </div>
  );
}

function StepContent({
  label,
  description,
  status,
  isCompleted,
  isCurrent,
  isDisabled,
  orientation,
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  status: StepStatus;
  isCompleted: boolean;
  isCurrent: boolean;
  isDisabled: boolean;
  orientation: "horizontal" | "vertical";
}) {
  return (
    <div className={cn("flex-1", orientation === "horizontal" && "min-w-0")}>
      <div className={getStepLabelClasses(status, isCompleted, isCurrent, isDisabled)}>
        {label}
      </div>
      {description && (
        <div className={cn("text-xs text-muted-foreground mt-1", isDisabled && "opacity-50")}>
          {description}
        </div>
      )}
    </div>
  );
}

/**
 * Individual step component for use within Stepper.
 * Access currentStep from parent context.
 */
export function StepperStep({
  step,
  label,
  description,
  status: statusProp,
  icon,
  className,
  ...props
}: StepperStepProps) {
  const context = React.useContext(StepperContext);
  const currentStep = context?.currentStep ?? 0;
  const orientation = context?.orientation ?? "horizontal";
  const isLastStep = context?.isLastStep ?? false;

  // Auto-calculate status if not provided
  const status: StepStatus =
    statusProp ??
    (step < currentStep ? "completed" : step === currentStep ? "current" : "upcoming");

  const isCompleted = status === "completed";
  const isCurrent = status === "current";
  const isDisabled = status === "disabled";

  return (
    <li
      className={cn(
        "flex items-start gap-3",
        orientation === "vertical" && "flex-col pb-8 last:pb-0",
        orientation === "horizontal" && "flex-1",
        className
      )}
      aria-current={isCurrent ? "step" : undefined}
      data-cy={`stepper-step-${step}`}
      {...props}
    >
      <div className={cn("flex items-center gap-3", orientation === "horizontal" && "flex-1")}>
        <StepIndicator
          isCompleted={isCompleted}
          icon={icon}
          step={step}
          status={status}
          isDisabled={isDisabled}
          isCurrent={isCurrent}
        />
        <StepContent
          label={label}
          description={description}
          status={status}
          isCompleted={isCompleted}
          isCurrent={isCurrent}
          isDisabled={isDisabled}
          orientation={orientation}
        />
        {orientation === "horizontal" && !isLastStep && (
          <div
            className={cn("h-[2px] flex-1 transition-colors", isCompleted ? "bg-primary" : "bg-muted")}
            aria-hidden="true"
          />
        )}
      </div>
      {orientation === "vertical" && !isLastStep && (
        <div
          className={cn("w-[2px] h-full ml-4 transition-colors", isCompleted ? "bg-primary" : "bg-muted")}
          aria-hidden="true"
        />
      )}
    </li>
  );
}

StepperStep.displayName = "StepperStep";

interface StepperContextValue {
  currentStep: number;
  orientation: "horizontal" | "vertical";
  isLastStep: boolean;
}

const StepperContext = React.createContext<StepperContextValue | null>(null);

/**
 * Stepper/Wizard component for multi-step flows.
 * Provides visual progress indicator with completed/current/upcoming states.
 */
export function Stepper({
  currentStep,
  orientation = "horizontal",
  children,
  className,
  ...props
}: StepperProps) {
  const childrenArray = React.Children.toArray(children);
  const stepCount = childrenArray.length;

  return (
    <StepperContext.Provider value={{ currentStep, orientation, isLastStep: false }}>
      <ol
        className={cn(
          "flex",
          orientation === "horizontal" && "items-center gap-2",
          orientation === "vertical" && "flex-col",
          className
        )}
        role="list"
        aria-label="Step progress"
        data-cy="stepper"
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return (
              <StepperContext.Provider
                key={index}
                value={{
                  currentStep,
                  orientation,
                  isLastStep: index === stepCount - 1,
                }}
              >
                {child}
              </StepperContext.Provider>
            );
          }
          return child;
        })}
      </ol>
    </StepperContext.Provider>
  );
}

Stepper.displayName = "Stepper";
