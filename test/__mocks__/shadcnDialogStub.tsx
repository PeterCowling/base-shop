import React, { createContext, useContext } from "react";

export function Card({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props}>
      {children}
    </div>
  );
}

export function Progress({
  value = 0,
  label,
  children,
  labelClassName: _labelClassName,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
  label?: React.ReactNode;
  labelClassName?: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-label={typeof label === "string" ? label : undefined}
      {...props}
    >
      {children ?? label ?? null}
    </div>
  );
}

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue>({ open: false, onOpenChange: () => {} });

export function Dialog({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode; }) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export function DialogTrigger({ children }: { children: React.ReactElement<any> }) {
  const ctx = useContext(DialogContext);
  return React.cloneElement(children, {
    onClick: (event: React.MouseEvent) => {
      ctx.onOpenChange(true);
      (children.props as any).onClick?.(event);
    },
  });
}

export function DialogContent({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open } = useContext(DialogContext);
  if (!open) return null;
  return (
    <div role="dialog" {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 {...props}>{children}</h2>
  );
}

type ButtonStubProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: string;
  // Non-DOM props supported by our real Button; ensure they don't leak to DOM
  iconOnly?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  iconSize?: "sm" | "md" | "lg";
  size?: "icon" | "sm";
  tone?: string;
  color?: string;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonStubProps>(
  ({
    asChild = false,
    children,
    className,
    onClick,
    variant: _variant,
    // strip non-DOM props to avoid React warnings in tests
    iconOnly: _iconOnly,
    leadingIcon: _leadingIcon,
    trailingIcon: _trailingIcon,
    iconSize: _iconSize,
    size: _size,
    tone: _tone,
    color: _color,
    ...rest
  }, ref) => {
    if (asChild && React.isValidElement(children)) {
      const childProps = children.props as Record<string, unknown>;
      const combinedClassName = [childProps.className, className]
        .filter(Boolean)
        .join(" ")
        .trim();

      const mergedProps: Record<string, unknown> = { ...rest };

      if (combinedClassName) {
        mergedProps.className = combinedClassName;
      }

      if (onClick) {
        const childOnClick = childProps.onClick as
          | ((event: React.MouseEvent<HTMLElement>) => void)
          | undefined;
        mergedProps.onClick = (event: React.MouseEvent<HTMLElement>) => {
          if (typeof childOnClick === "function") {
            childOnClick(event);
          }
          onClick(event as React.MouseEvent<HTMLButtonElement>);
        };
      }

      if (ref) {
        mergedProps.ref = ref;
      }

      return React.cloneElement(children, mergedProps);
    }

    return (
      <button ref={ref} className={className} onClick={onClick} {...rest}>
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

type CheckboxStubProps = React.InputHTMLAttributes<HTMLInputElement> & {
  onCheckedChange?: (checked: boolean) => void;
};

export function Checkbox({ onCheckedChange, ...props }: CheckboxStubProps) {
  return (
    <input
      type="checkbox"
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      {...props}
    />
  );
}

type InputStubProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
  labelClassName?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputStubProps>(
  ({ label: _label, labelClassName: _labelClassName, ...props }, ref) => {
    return <input ref={ref} {...props} />;
  },
);
Input.displayName = "Input";

type TextareaStubProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: React.ReactNode;
  labelClassName?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaStubProps>(
  ({ label: _label, labelClassName: _labelClassName, ...props }, ref) => {
    return <textarea ref={ref} {...props} />;
  },
);
Textarea.displayName = "Textarea";

export function Tag({
  children,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: string }) {
  return (
    <span data-variant={variant} {...props}>
      {children}
    </span>
  );
}

// Minimal Select primitives for tests that use shadcn Select
// These are intentionally simplified and only support the patterns used in tests.
type AnyProps = Record<string, any>;

export function Select({ value, onValueChange, children }: AnyProps) {
  // Gather <SelectItem value=...>text</SelectItem> within any nested wrappers
  const options: Array<{ value: string; label: React.ReactNode }> = [];
  const walk = (node: any) => {
    if (!node) return;
    const arr = React.Children.toArray(node);
    for (const child of arr) {
      if (!React.isValidElement(child)) continue;
      // Identify our stubbed SelectItem by a marker
      if ((child.type as any).__shadcnSelectItem === true) {
        const p = child.props as any;
        options.push({ value: p.value ?? "", label: p.children });
      }
      const p = child.props as any;
      if (p?.children) walk(p.children);
    }
  };
  walk(children);
  return (
    <select data-testid="layout-select" value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {/* Placeholder option if provided via <SelectValue placeholder=... /> */}
      {/* The placeholder renderer below is a no-op; real tests often set value directly. */}
      {options.map((opt) => (
        <option key={String(opt.value)} value={String(opt.value)}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
export function SelectContent({ children }: AnyProps) {
  return <>{children}</>;
}
export function SelectTrigger({ children, ...rest }: AnyProps) {
  return <div {...rest}>{children}</div>;
}
export function SelectValue({ placeholder }: AnyProps) {
  return <option value="">{placeholder}</option> as any;
}
export function SelectItem({ value, children }: AnyProps) {
  const Comp: any = ({ children: c }: AnyProps) => <>{c}</>;
  Comp.__shadcnSelectItem = true;
  return <Comp value={value}>{children}</Comp>;
}

// Table family
export function Table({ children, ...p }: React.HTMLAttributes<HTMLTableElement>) {
  return <table {...p}>{children}</table>;
}
export function TableBody({ children, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...p}>{children}</tbody>;
}
export function TableCell({ children, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td {...p}>{children}</td>;
}
export function TableHead({ children, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th {...p}>{children}</th>;
}
export function TableHeader({ children, ...p }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead {...p}>{children}</thead>;
}
export function TableRow({ children, ...p }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr {...p}>{children}</tr>;
}

// Accordion family
export function Accordion({ children, type: _type, collapsible: _col, ...p }: React.HTMLAttributes<HTMLDivElement> & { type?: string; collapsible?: boolean }) {
  return <div {...p}>{children}</div>;
}
export function AccordionContent({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p}>{children}</div>;
}
export function AccordionItem({ children, value: _value, ...p }: React.HTMLAttributes<HTMLDivElement> & { value?: string }) {
  return <div {...p}>{children}</div>;
}
export function AccordionTrigger({ children, ...p }: React.HTMLAttributes<HTMLButtonElement>) {
  return <button {...(p as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>;
}

// Dialog header
export function DialogHeader({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...p}>{children}</div>;
}

// DropdownMenu family — use AnyProps to accept Radix-specific props (align, side, aria-label, etc.)
export function DropdownMenu({ children }: AnyProps) {
  return <>{children}</>;
}
export function DropdownMenuContent({ children, align: _align, side: _side, sideOffset: _so, ...p }: AnyProps) {
  return <div {...p}>{children}</div>;
}
export function DropdownMenuItem({ children, onSelect: _onSelect, ...p }: AnyProps) {
  return <div role="menuitem" {...(p as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
}
export function DropdownMenuTrigger({ children, asChild: _asChild, ...p }: AnyProps) {
  return <>{children}</>;
}
