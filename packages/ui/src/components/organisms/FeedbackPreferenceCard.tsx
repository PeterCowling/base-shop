import * as React from "react";

import { cn } from "../../utils/style";
import { Button } from "../atoms/primitives/button";

export interface FeedbackPreferenceOption {
  id: string;
  label: string;
  onSelect?: () => void;
}

export interface FeedbackPreferenceCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  question: React.ReactNode;
  options: FeedbackPreferenceOption[];
  interactive?: boolean;
  titleClassName?: string;
  questionClassName?: string;
  optionsClassName?: string;
  optionClassName?: string;
}

export function FeedbackPreferenceCard({
  title,
  question,
  options,
  interactive = true,
  className,
  titleClassName,
  questionClassName,
  optionsClassName,
  optionClassName,
  ...props
}: FeedbackPreferenceCardProps) {
  return (
    <div className={cn("rounded-lg border p-6 space-y-3", className)} {...props}>
      <div className={cn("text-lg font-semibold", titleClassName)}>{title}</div>
      <p className={cn("text-sm text-muted-foreground", questionClassName)}>{question}</p>
      <div className={cn("flex flex-wrap gap-3", optionsClassName)}>
        {options.map((option) =>
          interactive ? (
            <Button
              key={option.id}
              type="button"
              variant="outline"
              onClick={option.onSelect}
              className={cn(optionClassName)}
            >
              {option.label}
            </Button>
          ) : (
            <span
              key={option.id}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-semibold",
                optionClassName,
              )}
            >
              {option.label}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
