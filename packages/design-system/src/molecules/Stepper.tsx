/* i18n-exempt file -- UI-000: Only non-user-facing literals (class names, HTML attributes). Labels are provided via props. */
"use client";

import * as React from "react";
import { CheckIcon } from "@radix-ui/react-icons";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "../primitives/shape-radius";
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
  /** Semantic step-indicator shape. Ignored when `indicatorRadius` is provided. */
  indicatorShape?: PrimitiveShape;
  /** Explicit step-indicator radius token override. */
  indicatorRadius?: PrimitiveRadius;
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
  /** Semantic step-indicator shape. Ignored when `indicatorRadius` is provided. */
  indicatorShape?: PrimitiveShape;
  /** Explicit step-indicator radius token override. */
  indicatorRadius?: PrimitiveRadius;
}

// Helper functions to reduce complexity
function getStepIndicatorClasses(
  status: StepStatus,
  isCompleted: boolean,
  isCurrent: boolean,
  isDisabled: boolean,
  shapeRadiusClass: string,
) {
  return cn(
    "grid size-8 shrink-0 place-content-center border-2 font-medium text-sm transition-colors",
    shapeRadiusClass,
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

function StepIndicator({ isCompleted, icon, step, status, isDisabled, isCurrent, shapeRadiusClass }: {
  isCompleted: boolean;
  icon?: React.ReactNode;
  step: number;
  status: StepStatus;
  isDisabled: boolean;
  isCurrent: boolean;
  shapeRadiusClass: string;
}) {
  return (
    <div className={getStepIndicatorClasses(status, isCompleted, isCurrent, isDisabled, shapeRadiusClass)}>
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

function resolveStepStatus(statusProp: StepStatus | undefined, step: number, currentStep: number): StepStatus {
  if (statusProp) return statusProp;
  if (step < currentStep) return "completed";
  if (step === currentStep) return "current";
  return "upcoming";
}

function StepperStepLayout({
  step,
  label,
  description,
  icon,
  className,
  props,
  orientation,
  status,
  isCompleted,
  isCurrent,
  isDisabled,
  isLastStep,
  stepIndicatorShapeRadiusClass,
}: {
  step: number;
  label: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  props: Omit<StepperStepProps, "step" | "label" | "description" | "status" | "icon" | "className">;
  orientation: "horizontal" | "vertical";
  status: StepStatus;
  isCompleted: boolean;
  isCurrent: boolean;
  isDisabled: boolean;
  isLastStep: boolean;
  stepIndicatorShapeRadiusClass: string;
}) {
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
          shapeRadiusClass={stepIndicatorShapeRadiusClass}
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
        {orientation === "horizontal" && !isLastStep ? (
          <div
            className={cn(
              "h-[2px] flex-1 transition-colors",
              isCompleted ? "bg-primary" : "bg-muted"
            )}
            aria-hidden="true"
            data-ds-contrast-exempt
          />
        ) : null}
      </div>
      {orientation === "vertical" && !isLastStep ? (
        <div
          className={cn(
            "w-[2px] h-full ml-4 transition-colors",
            isCompleted ? "bg-primary" : "bg-muted"
          )}
          aria-hidden="true"
          data-ds-contrast-exempt
        />
      ) : null}
    </li>
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
  indicatorShape,
  indicatorRadius,
  className,
  ...props
}: StepperStepProps) {
  const context = React.useContext(StepperContext);
  const currentStep = context?.currentStep ?? 0;
  const orientation = context?.orientation ?? "horizontal";
  const isLastStep = context?.isLastStep ?? false;
  const stepIndicatorShape = indicatorShape ?? context?.indicatorShape;
  const stepIndicatorRadius = indicatorRadius ?? context?.indicatorRadius;
  const stepIndicatorShapeRadiusClass = resolveShapeRadiusClass({
    shape: stepIndicatorShape,
    radius: stepIndicatorRadius,
    defaultRadius: "full",
  });

  const status = resolveStepStatus(statusProp, step, currentStep);
  const isCompleted = status === "completed";
  const isCurrent = status === "current";
  const isDisabled = status === "disabled";

  return (
    <StepperStepLayout
      step={step}
      label={label}
      description={description}
      icon={icon}
      className={className}
      props={props}
      orientation={orientation}
      status={status}
      isCompleted={isCompleted}
      isCurrent={isCurrent}
      isDisabled={isDisabled}
      isLastStep={isLastStep}
      stepIndicatorShapeRadiusClass={stepIndicatorShapeRadiusClass}
    />
  );
}

StepperStep.displayName = "StepperStep";

interface StepperContextValue {
  currentStep: number;
  orientation: "horizontal" | "vertical";
  isLastStep: boolean;
  indicatorShape?: PrimitiveShape;
  indicatorRadius?: PrimitiveRadius;
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
  indicatorShape,
  indicatorRadius,
  className,
  ...props
}: StepperProps) {
  const childrenArray = React.Children.toArray(children);
  const stepCount = childrenArray.length;

  return (
    <StepperContext.Provider
      value={{
        currentStep,
        orientation,
        isLastStep: false,
        indicatorShape,
        indicatorRadius,
      }}
    >
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
                  indicatorShape,
                  indicatorRadius,
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
