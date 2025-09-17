"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { cn } from "../../utils/style";

export interface AccordionItemConfig {
  title: ReactNode;
  content: ReactNode;
}

type LegacyAccordionProps = {
  items: AccordionItemConfig[];
  className?: string;
};

type AccordionSingleProps = {
  type?: "single";
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  collapsible?: boolean;
  className?: string;
  children: ReactNode;
};

type AccordionMultipleProps = {
  type: "multiple";
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  className?: string;
  children: ReactNode;
};

export type AccordionProps =
  | LegacyAccordionProps
  | AccordionSingleProps
  | AccordionMultipleProps;

interface AccordionContextValue {
  type: "single" | "multiple";
  openValues: string[];
  collapsible: boolean;
  toggle: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within <Accordion>");
  }
  return context;
}

interface AccordionItemContextValue {
  value: string;
  disabled?: boolean;
  open: boolean;
}

const AccordionItemContext =
  createContext<AccordionItemContextValue | null>(null);

function useAccordionItemContext() {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error(
      "AccordionTrigger and AccordionContent must be used within <AccordionItem>",
    );
  }
  return context;
}

function parseValue(
  value: string | string[] | undefined,
  type: "single" | "multiple",
) {
  if (value === undefined) return [] as string[];
  if (Array.isArray(value)) {
    return type === "single" ? value.slice(0, 1) : value;
  }
  return value ? [value] : [];
}

type AccordionRootProps = AccordionSingleProps | AccordionMultipleProps;

function AccordionRoot(props: AccordionRootProps) {
  const { className, children } = props;
  const isMultiple = props.type === "multiple";
  const type: "single" | "multiple" = isMultiple ? "multiple" : "single";

  const defaultValue = isMultiple
    ? parseValue(props.defaultValue, type)
    : parseValue(props.defaultValue, type);

  const value = isMultiple
    ? parseValue(props.value, type)
    : parseValue(props.value, type);

  const onValueChange = isMultiple
    ? props.onValueChange
    : props.onValueChange;

  const collapsible = isMultiple ? true : props.collapsible ?? false;

  const [internalValues, setInternalValues] = useState<string[]>(
    () => defaultValue,
  );

  const isControlled = props.value !== undefined;
  const openValues = isControlled ? value : internalValues;

  const setValues = useCallback(
    (next: string[]) => {
      if (!isControlled) {
        setInternalValues(next);
      }
      if (isMultiple) {
        onValueChange?.(next);
      } else {
        onValueChange?.(next[0]);
      }
    },
    [isControlled, isMultiple, onValueChange],
  );

  const toggle = useCallback(
    (valueToToggle: string) => {
      if (isMultiple) {
        const set = new Set(openValues);
        if (set.has(valueToToggle)) {
          set.delete(valueToToggle);
        } else {
          set.add(valueToToggle);
        }
        setValues(Array.from(set));
      } else {
        const isOpen = openValues[0] === valueToToggle;
        if (isOpen) {
          if (collapsible) {
            setValues([]);
          }
        } else {
          setValues([valueToToggle]);
        }
      }
    },
    [collapsible, isMultiple, openValues, setValues],
  );

  const contextValue = useMemo<AccordionContextValue>(
    () => ({ type, openValues, collapsible, toggle }),
    [type, openValues, collapsible, toggle],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

function AccordionWithItems({ items, className }: LegacyAccordionProps) {
  if (!items || items.length === 0) {
    return <div className={cn("space-y-2", className)} />;
  }

  return (
    <AccordionRoot type="multiple" className={className}>
      {items.map((item, index) => (
        <AccordionItem value={`item-${index}`} key={`item-${index}`}>
          <AccordionTrigger>{item.title}</AccordionTrigger>
          <AccordionContent>{item.content}</AccordionContent>
        </AccordionItem>
      ))}
    </AccordionRoot>
  );
}

export function Accordion(props: AccordionProps) {
  if ("items" in props) {
    return <AccordionWithItems {...props} />;
  }

  return <AccordionRoot {...props} />;
}

export interface AccordionItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
  children: ReactNode;
}

export function AccordionItem({
  value,
  disabled = false,
  className,
  children,
  ...props
}: AccordionItemProps) {
  const { openValues } = useAccordionContext();
  const open = openValues.includes(value);

  const contextValue = useMemo(
    () => ({ value, disabled, open }),
    [value, disabled, open],
  );

  return (
    <AccordionItemContext.Provider value={contextValue}>
      <div
        {...props}
        data-state={open ? "open" : "closed"}
        data-disabled={disabled ? "" : undefined}
        className={cn("rounded border border-border/60", className)}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export interface AccordionTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function AccordionTrigger({
  children,
  className,
  onClick,
  onKeyDown,
  ...props
}: AccordionTriggerProps) {
  const { toggle } = useAccordionContext();
  const { value, disabled, open } = useAccordionItemContext();

  const handleClick = useCallback<
    React.MouseEventHandler<HTMLButtonElement>
  >(
    (event) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      if (disabled) return;
      toggle(value);
    },
    [disabled, onClick, toggle, value],
  );

  const handleKeyDown = useCallback<
    React.KeyboardEventHandler<HTMLButtonElement>
  >(
    (event) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (disabled) return;
      if (
        event.key === " " ||
        event.key === "Enter" ||
        event.key === "Space" ||
        event.key === "Spacebar"
      ) {
        event.preventDefault();
        toggle(value);
      }
    },
    [disabled, onKeyDown, toggle, value],
  );

  return (
    <button
      type="button"
      {...props}
      className={cn(
        "flex w-full items-center justify-between p-2 text-left",
        className,
      )}
      aria-expanded={open}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
    >
      <span>{children}</span>
      <span aria-hidden="true">{open ? "-" : "+"}</span>
    </button>
  );
}

export interface AccordionContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function AccordionContent({
  children,
  className,
  ...props
}: AccordionContentProps) {
  const { open } = useAccordionItemContext();

  if (!open) return null;

  return (
    <div
      {...props}
      data-state="open"
      className={cn("border-t p-2", className)}
    >
      {children}
    </div>
  );
}

export default Accordion;
