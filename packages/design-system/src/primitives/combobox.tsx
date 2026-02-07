"use client";

import * as React from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import * as PopoverPrimitive from "@radix-ui/react-popover";

import { cn } from "../utils/style";

interface ComboboxContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null);

function useComboboxContext() {
  const context = React.use(ComboboxContext);
  if (!context) {
    throw new Error("Combobox components must be used within a Combobox");
  }
  return context;
}

export interface ComboboxProps {
  children: React.ReactNode;
  value?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultValue?: string;
  defaultOpen?: boolean;
}

export function Combobox({
  children,
  value: controlledValue,
  onValueChange,
  open: controlledOpen,
  onOpenChange,
  defaultValue = "",
  defaultOpen = false,
}: ComboboxProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const [search, setSearch] = React.useState("");

  const value = controlledValue !== undefined ? controlledValue : uncontrolledValue;
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;

  const handleValueChange = React.useCallback((newValue: string) => {
    if (controlledValue === undefined) {
      setUncontrolledValue(newValue);
    }
    onValueChange?.(newValue);
  }, [controlledValue, onValueChange]);

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
    if (!newOpen) {
      setSearch("");
    }
  }, [controlledOpen, onOpenChange]);

  const contextValue = React.useMemo(
    () => ({
      value,
      onValueChange: handleValueChange,
      open,
      onOpenChange: handleOpenChange,
      search,
      setSearch,
    }),
    [value, open, search, handleValueChange, handleOpenChange]
  );

  return (
    <ComboboxContext value={contextValue}>
      <PopoverPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        {children}
      </PopoverPrimitive.Root>
    </ComboboxContext>
  );
}

export interface ComboboxTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>;
}

export function ComboboxTrigger({
  ref,
  className,
  children,
  ...props
}: ComboboxTriggerProps) {
  return (
    <PopoverPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-[var(--ring-width)] focus-visible:ring-offset-[var(--ring-offset-width)] focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </PopoverPrimitive.Trigger>
  );
}

export interface ComboboxContentProps extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  ref?: React.Ref<HTMLDivElement>;
}

export function ComboboxContent({
  ref,
  className,
  children,
  ...props
}: ComboboxContentProps) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align="start"
        className={cn(
          "w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-md border border-border-2 bg-panel p-1 text-foreground shadow-elevation-2",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        {...props}
      >
        <div className="max-h-80 overflow-y-auto p-1">
          {children}
        </div>
      </PopoverPrimitive.Content>
    </PopoverPrimitive.Portal>
  );
}

export interface ComboboxInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  ref?: React.Ref<HTMLInputElement>;
}

export function ComboboxInput({
  ref,
  className,
  ...props
}: ComboboxInputProps) {
  const { search, setSearch } = useComboboxContext();

  return (
    <input
      ref={ref}
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground",
        "placeholder:text-muted-foreground",
        "focus-visible:outline-none focus-visible:ring-[var(--ring-width)] focus-visible:ring-offset-[var(--ring-offset-width)] focus-visible:ring-ring",
        "mb-1",
        className
      )}
      {...props}
    />
  );
}

export interface ComboboxEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  ref?: React.Ref<HTMLDivElement>;
}

export function ComboboxEmpty({
  ref,
  className,
  children = "No results found.",
  ...props
}: ComboboxEmptyProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "py-6 text-center text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface ComboboxItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>;
  value: string;
  keywords?: string[];
}

export function ComboboxItem({
  ref,
  className,
  value,
  children,
  keywords = [],
  ...props
}: ComboboxItemProps) {
  const { value: selectedValue, onValueChange, onOpenChange, search } = useComboboxContext();

  const searchLower = search.toLowerCase();
  const valueLower = value.toLowerCase();
  const childrenText = typeof children === "string" ? children.toLowerCase() : "";
  const keywordsLower = keywords.map((k) => k.toLowerCase());

  const matches =
    valueLower.includes(searchLower) ||
    childrenText.includes(searchLower) ||
    keywordsLower.some((k) => k.includes(searchLower));

  if (search && !matches) {
    return null;
  }

  const isSelected = selectedValue === value;

  const handleSelect = () => {
    onValueChange(value);
    onOpenChange(false);
  };

  return (
    <button
      ref={ref}
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={handleSelect}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pe-2 ps-8 text-sm text-fg outline-none",
        "hover:bg-surface-3 focus:bg-accent focus:text-accent-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute start-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <CheckIcon className="h-4 w-4" />}
      </span>
      {children}
    </button>
  );
}
