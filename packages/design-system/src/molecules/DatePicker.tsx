"use client";

import "./DatePicker.css";

import * as React from "react";
import ReactDatePicker from "react-datepicker";

import {
  type PrimitiveRadius,
  type PrimitiveShape,
  resolveShapeRadiusClass,
} from "../primitives/shape-radius";
import { cn } from "../utils/style";

export interface DatePickerProps {
  id?: string;
  selected?: Date | null;
  onChange?: (date: Date | null, event?: React.MouseEvent | React.KeyboardEvent) => void;
  minDate?: Date | null;
  maxDate?: Date | null;
  dateFormat?: string | string[];
  placeholderText?: string;
  className?: string;
  wrapperClassName?: string;
  invalid?: boolean;
  /** Semantic input shape. Ignored when `radius` is provided. */
  shape?: PrimitiveShape;
  /** Explicit input radius token override. */
  radius?: PrimitiveRadius;
  disabled?: boolean;
  name?: string;
  autoComplete?: string;
  required?: boolean;
  inline?: boolean;
  showTimeSelect?: boolean;
  timeFormat?: string;
  timeIntervals?: number;
  isClearable?: boolean;
  filterDate?: (date: Date) => boolean;
}

export const DatePicker = (
  {
    ref,
    className,
    wrapperClassName,
    invalid,
    shape,
    radius,
    ...props
  }: DatePickerProps & {
    ref?: React.Ref<ReactDatePicker>;
  }
) => {
  const shapeRadiusClass = resolveShapeRadiusClass({
    shape,
    radius,
    defaultRadius: "md",
  });

  return (
    <ReactDatePicker
      ref={ref}
      className={cn(
        "w-full border border-border-2 bg-input px-3 py-2",
        "text-sm text-foreground placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50",
        shapeRadiusClass,
        invalid && "border-danger",
        className,
      )}
      wrapperClassName={cn("w-full", wrapperClassName)}
      popperClassName="ds-datepicker-popper"
      calendarClassName="ds-datepicker-calendar"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DS-1234: react-datepicker uses a complex discriminated union; our interface provides consumer type safety
      {...(props as any)}
    />
  );
};
