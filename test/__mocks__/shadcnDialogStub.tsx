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

export function Progress({ value = 0, ...props }: React.HTMLAttributes<HTMLDivElement> & { value?: number }) {
  return (
    <div role="progressbar" aria-valuenow={value} {...props}>
      {props.children}
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

export function DialogTrigger({ children }: { children: React.ReactElement }) {
  const ctx = useContext(DialogContext);
  return React.cloneElement(children, {
    onClick: (event: React.MouseEvent) => {
      ctx.onOpenChange(true);
      children.props.onClick?.(event);
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

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} />;
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return <textarea {...props} />;
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
        options.push({ value: child.props.value ?? "", label: child.props.children });
      }
      if (child.props?.children) walk(child.props.children);
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
