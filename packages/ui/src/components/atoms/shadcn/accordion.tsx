"use client";

import { createContext, useCallback, useContext, useId, useMemo, useState } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

import { cn } from "../../utils/style";

interface AccordionContextValue {
  type: "single" | "multiple";
  collapsible: boolean;
  openValues: string[];
  toggle: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within <Accordion>");
  }
  return context;
}

function toArray(value: string | string[] | undefined, type: "single" | "multiple") {
  if (!value) return [];
  if (Array.isArray(value)) {
    return type === "single" ? value.slice(0, 1) : value;
  }
  return [value];
}

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  collapsible?: boolean;
  children: ReactNode;
}

export function Accordion({
  type = "multiple",
  defaultValue,
  collapsible = true,
  className,
  children,
  ...props
}: AccordionProps) {
  const [openValues, setOpenValues] = useState<string[]>(() =>
    toArray(defaultValue, type),
  );

  const toggle = useCallback(
    (value: string) => {
      setOpenValues((previous) => {
        const isActive = previous.includes(value);
        if (type === "single") {
          if (isActive) {
            return collapsible ? [] : previous;
          }
          return [value];
        }
        if (isActive) {
          return previous.filter((item) => item !== value);
        }
        return [...previous, value];
      });
    },
    [collapsible, type],
  );

  const contextValue = useMemo(
    () => ({ type, collapsible, openValues, toggle }),
    [type, collapsible, openValues, toggle],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={cn("divide-y rounded-lg border", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
  triggerId: string;
  contentId: string;
}

const AccordionItemContext = createContext<AccordionItemContextValue | undefined>(
  undefined,
);

function useAccordionItemContext() {
  const context = useContext(AccordionItemContext);
  if (!context) {
    throw new Error("Accordion components must be rendered inside <AccordionItem>");
  }
  return context;
}

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function AccordionItem({ value, className, children, ...props }: AccordionItemProps) {
  const { openValues } = useAccordionContext();
  const isOpen = openValues.includes(value);
  const id = useId();
  const triggerId = `${id}-trigger`;
  const contentId = `${id}-content`;

  const itemContext = useMemo(
    () => ({ value, isOpen, triggerId, contentId }),
    [value, isOpen, triggerId, contentId],
  );

  return (
    <AccordionItemContext.Provider value={itemContext}>
      <div
        data-state={isOpen ? "open" : "collapsed"}
        className={cn("border-b last:border-b-0", className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export interface AccordionTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {}

export function AccordionTrigger({ className, children, ...props }: AccordionTriggerProps) {
  const { toggle } = useAccordionContext();
  const { value, isOpen, contentId, triggerId } = useAccordionItemContext();

  return (
    <button
      type="button"
      id={triggerId}
      aria-controls={contentId}
      aria-expanded={isOpen}
      data-state={isOpen ? "open" : "collapsed"}
      onClick={() => toggle(value)}
      className={cn(
        "flex w-full items-center justify-between px-4 py-4 text-left text-sm font-medium transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    >
      <span>{children}</span>
      <span aria-hidden className="ml-2 text-lg leading-none">
        {isOpen ? "−" : "+"}
      </span>
    </button>
  );
}

export interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {}

export function AccordionContent({ className, children, ...props }: AccordionContentProps) {
  const { isOpen, contentId, triggerId } = useAccordionItemContext();

  return (
    <div
      id={contentId}
      role="region"
      aria-labelledby={triggerId}
      hidden={!isOpen}
      data-state={isOpen ? "open" : "collapsed"}
      className={cn("px-4 pb-6 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}
