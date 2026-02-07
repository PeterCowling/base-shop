"use client";
// i18n-exempt file -- DS-1234 [ttl=2025-11-30] — form integration layer; no hardcoded copy

import * as React from "react";
import {
  Controller,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form";

import { cn } from "../../utils/style";

/* ──────────────────────────────────────────────────────────────────────────────
 * Form Context
 * ──────────────────────────────────────────────────────────────────────────── */

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

/* ──────────────────────────────────────────────────────────────────────────────
 * Hooks
 * ──────────────────────────────────────────────────────────────────────────── */

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

/* ──────────────────────────────────────────────────────────────────────────────
 * Form (wrapper around FormProvider)
 * ──────────────────────────────────────────────────────────────────────────── */

export const Form = FormProvider;

/* ──────────────────────────────────────────────────────────────────────────────
 * FormField (integrates with react-hook-form Controller)
 * ──────────────────────────────────────────────────────────────────────────── */

export interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  control: React.ComponentPropsWithoutRef<typeof Controller<TFieldValues, TName>>["control"];
  name: TName;
  rules?: React.ComponentPropsWithoutRef<typeof Controller<TFieldValues, TName>>["rules"];
  shouldUnregister?: React.ComponentPropsWithoutRef<typeof Controller<TFieldValues, TName>>["shouldUnregister"];
  defaultValue?: React.ComponentPropsWithoutRef<typeof Controller<TFieldValues, TName>>["defaultValue"];
  disabled?: React.ComponentPropsWithoutRef<typeof Controller<TFieldValues, TName>>["disabled"];
  render: (props: {
    field: {
      onChange: (...event: unknown[]) => void;
      onBlur: () => void;
      value: TFieldValues[TName];
      disabled?: boolean;
      name: TName;
      ref: React.Ref<unknown>;
    };
  }) => React.ReactElement;
}

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  rules,
  shouldUnregister,
  defaultValue,
  disabled,
  render,
}: FormFieldProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext value={{ name }}>
      <Controller
        control={control}
        name={name}
        rules={rules}
        shouldUnregister={shouldUnregister}
        defaultValue={defaultValue}
        disabled={disabled}
        render={({ field }) => render({ field })}
      />
    </FormFieldContext>
  );
};

/* ──────────────────────────────────────────────────────────────────────────────
 * FormItem (wrapper for individual form items)
 * ──────────────────────────────────────────────────────────────────────────── */

export type FormItemProps = React.HTMLAttributes<HTMLDivElement>;

export const FormItem = ({
  ref,
  className,
  ...props
}: FormItemProps & {
  ref?: React.Ref<HTMLDivElement>;
}) => {
  const id = React.useId();

  return (
    <FormItemContext value={{ id }}>
      <div ref={ref} className={cn("space-y-1", className)} {...props} />
    </FormItemContext>
  );
};

/* ──────────────────────────────────────────────────────────────────────────────
 * FormLabel
 * ──────────────────────────────────────────────────────────────────────────── */

export interface FormLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const FormLabel = ({
  ref,
  className,
  required,
  ...props
}: FormLabelProps & {
  ref?: React.Ref<HTMLLabelElement>;
}) => {
  const { error, formItemId } = useFormField();

  return (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium text-foreground",
        error && "text-danger",
        className
      )}
      htmlFor={formItemId}
      {...props}
    >
      {props.children}
      {required ? <span className="text-destructive ms-1">*</span> : null}
    </label>
  );
};

/* ──────────────────────────────────────────────────────────────────────────────
 * FormControl (wraps the actual input/textarea/select/etc)
 * ──────────────────────────────────────────────────────────────────────────── */

export interface FormControlProps {
  children: React.ReactElement;
}

export const FormControl = ({
  ref,
  children,
}: FormControlProps & {
  ref?: React.Ref<HTMLElement>;
}) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return React.cloneElement(children, {
    id: formItemId,
    "aria-describedby": !error
      ? `${formDescriptionId}`
      : `${formDescriptionId} ${formMessageId}`,
    "aria-invalid": !!error || undefined,
    ref,
  } as Partial<typeof children.props>);
};

/* ──────────────────────────────────────────────────────────────────────────────
 * FormDescription
 * ──────────────────────────────────────────────────────────────────────────── */

export type FormDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

export const FormDescription = ({
  ref,
  className,
  ...props
}: FormDescriptionProps & {
  ref?: React.Ref<HTMLParagraphElement>;
}) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
};

/* ──────────────────────────────────────────────────────────────────────────────
 * FormMessage (displays validation errors)
 * ──────────────────────────────────────────────────────────────────────────── */

export interface FormMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
}

export const FormMessage = ({
  ref,
  className,
  children,
  ...props
}: FormMessageProps & {
  ref?: React.Ref<HTMLParagraphElement>;
}) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm text-danger", className)}
      role="alert"
      {...props}
    >
      {body}
    </p>
  );
};
