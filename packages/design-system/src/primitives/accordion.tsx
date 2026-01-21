"use client";

import {
  type ButtonHTMLAttributes,
  createContext,
  forwardRef,
  type HTMLAttributes,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { ChevronDownIcon } from "@radix-ui/react-icons";

import { cn } from "../utils/style";

type AccordionType = "single" | "multiple";

interface AccordionContextValue {
  readonly type: AccordionType;
  readonly openValues: readonly string[];
  readonly toggle: (value: string) => void;
  readonly collapsible: boolean;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const context = useContext(AccordionContext);
  if (!context) {
    // Developer-facing usage error; not user-visible copy
     
    throw new Error("Accordion components must be used within <Accordion>");
  }
  return context;
}

const AccordionItemContext = createContext<string | null>(null);

function useAccordionItemValue() {
  const value = useContext(AccordionItemContext);
  if (!value) {
    // Developer-facing usage error; not user-visible copy
     
    throw new Error("AccordionTrigger and AccordionContent must be rendered inside AccordionItem");
  }
  return value;
}

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  readonly type?: AccordionType;
  readonly defaultValue?: string | string[];
  readonly collapsible?: boolean;
}

function toArray(value: string | string[] | undefined) {
  if (!value) return [] as string[];
  return Array.isArray(value) ? value : [value];
}

export function Accordion({
  type = "single",
  defaultValue,
  collapsible = true,
  children,
  className,
  ...props
}: AccordionProps) {
  const initialValues = useMemo(() => {
    const normalized = toArray(defaultValue);
    if (type === "single") {
      const first = normalized[0];
      return typeof first === "string" ? [first] : [];
    }
    return Array.from(new Set(normalized));
  }, [defaultValue, type]);

  const [openValues, setOpenValues] = useState<string[]>(initialValues);

  const toggle = useCallback(
    (value: string) => {
      setOpenValues((current) => {
        const isOpen = current.includes(value);
        if (type === "single") {
          if (isOpen) {
            return collapsible ? [] : current;
          }
          return [value];
        }
        if (isOpen) {
          return current.filter((entry) => entry !== value);
        }
        return [...current, value];
      });
    },
    [type, collapsible],
  );

  const context = useMemo<AccordionContextValue>(
    () => ({ type, openValues, toggle, collapsible }),
    [type, openValues, toggle, collapsible],
  );

  return (
    <AccordionContext.Provider value={context}>
      <div className={cn("space-y-2", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  readonly value: string;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const { openValues } = useAccordionContext();
    const isOpen = openValues.includes(value);
    return (
      <AccordionItemContext.Provider value={value}>
        <div
          ref={ref}
          data-state={isOpen ? "open" : "closed"}
          data-value={value}
          className={cn(
            // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
            "rounded-md border border-border-3",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  },
);
AccordionItem.displayName = "AccordionItem";

export type AccordionTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const AccordionTrigger = forwardRef<
  HTMLButtonElement,
  AccordionTriggerProps
>(({ className, children, onClick, ...props }, ref) => {
  const value = useAccordionItemValue();
  const { openValues, toggle } = useAccordionContext();
  const isOpen = openValues.includes(value);

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    toggle(value);
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-expanded={isOpen}
      data-state={isOpen ? "open" : "closed"}
      onClick={handleClick}
      className={cn(
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
        "flex w-full items-center justify-between gap-2 rounded-md px-4 py-2 text-start text-sm font-semibold transition-colors",
        // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      <span className="flex-1">{children}</span>
      <ChevronDownIcon
        aria-hidden
        className={cn(
          // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
          "h-4 w-4 shrink-0 transition-transform duration-200",
          // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
          isOpen ? "rotate-180" : "rotate-0",
        )}
      />
    </button>
  );
});
AccordionTrigger.displayName = "AccordionTrigger";

export type AccordionContentProps = HTMLAttributes<HTMLDivElement>;

export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const value = useAccordionItemValue();
    const { openValues } = useAccordionContext();
    const isOpen = openValues.includes(value);

    return (
      <div
        ref={ref}
        data-state={isOpen ? "open" : "closed"}
        hidden={!isOpen}
        className={cn(
          // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
          "px-4 pb-4 text-sm",
          className,
          // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
          !isOpen && "hidden",
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
AccordionContent.displayName = "AccordionContent";
